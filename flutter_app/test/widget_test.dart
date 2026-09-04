import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:kaun_dega/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('App renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const KaunDegaApp());
    await tester.pump(const Duration(seconds: 1));
    expect(find.byType(KaunDegaApp), findsOneWidget);
  });
}

