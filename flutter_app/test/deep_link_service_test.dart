import 'package:flutter_test/flutter_test.dart';
import 'package:kaun_dega/services/deep_link_service.dart';

void main() {
  group('DeepLinkService Code Extraction Tests', () {
    test('extracts code from kaundega://join/[code]', () {
      final uri = Uri.parse('kaundega://join/grp_summer_trip_2026');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, 'grp_summer_trip_2026');
    });

    test('extracts code from kaundega://groups/[code]', () {
      final uri = Uri.parse('kaundega://groups/grp_office_lunch');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, 'grp_office_lunch');
    });

    test('extracts code from https://kaun-dega.vercel.app/join/[code]', () {
      final uri = Uri.parse('https://kaun-dega.vercel.app/join/grp_flat_rent');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, 'grp_flat_rent');
    });

    test('extracts code from https://kaun-dega.vercel.app/groups/[code]', () {
      final uri = Uri.parse('https://kaun-dega.vercel.app/groups/grp_flat_rent');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, 'grp_flat_rent');
    });

    test('extracts code from kaundega://kaun-dega.vercel.app/join/[code]', () {
      final uri = Uri.parse('kaundega://kaun-dega.vercel.app/join/grp_dinner');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, 'grp_dinner');
    });

    test('returns null for unrelated URLs', () {
      final uri = Uri.parse('https://kaun-dega.vercel.app/dashboard');
      final code = DeepLinkService.instance.extractCode(uri);
      expect(code, isNull);
    });
  });
}
