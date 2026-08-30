package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupRepository extends JpaRepository<Group, UUID> {
    @EntityGraph(attributePaths = {"members"})
    List<Group> findByCreatedById(UUID userId);
    
    @EntityGraph(attributePaths = {"members"})
    List<Group> findByMembersContains(User user);
    
    @EntityGraph(attributePaths = {"members"})
    List<Group> findByIdIn(List<UUID> ids);
    
    @EntityGraph(attributePaths = {"members"})
    Optional<Group> findById(UUID id);
}
