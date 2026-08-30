package com.kaundega.backend.util;

import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TestDataFactory {

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public static User createTestUser(String email, String name) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .name(name)
                .password(passwordEncoder.encode("password123"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    public static Group createTestGroup(String name, User creator) {
        List<User> members = new ArrayList<>();
        members.add(creator);
        return Group.builder()
                .id(UUID.randomUUID())
                .name(name)
                .createdBy(creator)
                .members(members)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
