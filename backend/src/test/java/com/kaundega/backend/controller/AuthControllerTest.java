package com.kaundega.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaundega.backend.dto.LoginRequest;
import com.kaundega.backend.dto.RegisterRequest;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }

    @Test
    void register_newUser_success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setName("Test User");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@example.com"));
    }

    @Test
    void register_duplicateEmail_fails() throws Exception {
        User user = User.builder().email("dup@example.com").password("pass").name("Dup").build();
        userRepository.save(user);

        RegisterRequest request = new RegisterRequest();
        request.setEmail("dup@example.com");
        request.setPassword("password123");
        request.setName("Test User 2");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_validCredentials_returnsToken() throws Exception {
        User user = User.builder()
                .email("login@example.com")
                .password(passwordEncoder.encode("secret"))
                .name("Login User")
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("login@example.com");
        request.setPassword("secret");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void login_invalidPassword_fails() throws Exception {
        User user = User.builder()
                .email("wrong@example.com")
                .password(passwordEncoder.encode("secret"))
                .name("Wrong User")
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("wrong@example.com");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
