# Flutter Engine & Wrapper rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.provider.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Generated Flutter Plugin Registrant
-keep class io.flutter.plugins.GeneratedPluginRegistrant { *; }

# Firebase & Google Play Services & Recaptcha & Google Sign-In
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keep class com.google.android.recaptcha.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.recaptcha.**

# Keep attributes needed for JSON parsing, reflection, and annotations
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Prevent shrinking of native methods
-keepclasseswithmembers class * {
    native <methods>;
}

