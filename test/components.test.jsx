import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GroupIcon, { ICON_MAP } from '../components/GroupIcon';
import Chit from '../components/Chit';
import LandingHeader from '../components/LandingHeader';
import { 
  Skeleton, 
  GroupCardSkeleton, 
  TransactionSkeleton, 
  GroupDetailSkeleton, 
  ProfileSkeleton, 
  ReportSkeleton, 
  JoinSkeleton 
} from '../components/Skeleton';

describe('Web Component Unit Tests', () => {
  describe('GroupIcon Component', () => {
    it('renders food icon when category is food or emoji', () => {
      const { container } = render(<GroupIcon icon="food" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders trip icon when category is trip', () => {
      const { container } = render(<GroupIcon icon="trip" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('falls back to receipt icon for unknown categories', () => {
      const { container } = render(<GroupIcon icon="unknown_key" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Chit Component', () => {
    it('renders children with proper container styling', () => {
      render(
        <Chit className="custom-test-class">
          <span>Expense Details</span>
        </Chit>
      );
      expect(screen.getByText('Expense Details')).toBeInTheDocument();
    });
  });

  describe('LandingHeader Component', () => {
    it('renders logo, brand title, navigation links, and action buttons', () => {
      render(<LandingHeader />);

      expect(screen.getByAltText('Kaun Dega Logo')).toBeInTheDocument();
      expect(screen.getByText('Kaun')).toBeInTheDocument();
      expect(screen.getByText('Dega')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('How it Works')).toBeInTheDocument();
      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });
  });

  describe('Skeleton Loading Components', () => {
    it('renders base skeleton with pulse animation', () => {
      const { container } = render(<Skeleton className="w-20 h-4" />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders GroupCardSkeleton and TransactionSkeleton correctly', () => {
      const { container: cardCont } = render(<GroupCardSkeleton count={2} />);
      expect(cardCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      const { container: transCont } = render(<TransactionSkeleton count={3} />);
      expect(transCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders GroupDetailSkeleton, ProfileSkeleton, ReportSkeleton and JoinSkeleton', () => {
      const { container: detailCont } = render(<GroupDetailSkeleton />);
      expect(detailCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      const { container: profCont } = render(<ProfileSkeleton />);
      expect(profCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      const { container: repCont } = render(<ReportSkeleton />);
      expect(repCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      const { container: joinCont } = render(<JoinSkeleton />);
      expect(joinCont.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });
});
