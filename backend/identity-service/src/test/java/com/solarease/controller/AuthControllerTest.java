package com.solarease.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solarease.dto.AuthResponse;
import com.solarease.dto.LoginRequest;
import com.solarease.dto.RegisterRequest;
import com.solarease.exception.BadRequestException;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        loginRequest = LoginRequest.builder()
                .email("test@solarease.com")
                .password("password123")
                .build();

        registerRequest = RegisterRequest.builder()
                .email("newuser@solarease.com")
                .username("newuser")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .phone("1234567890")
                .build();

        authResponse = AuthResponse.builder()
                .accessToken("mock-access-token")
                .refreshToken("mock-refresh-token")
                .expiresIn(86400000L)
                .user(AuthResponse.UserDto.builder()
                        .id(1L)
                        .uuid("test-uuid")
                        .email("test@solarease.com")
                        .username("testuser")
                        .firstName("Test")
                        .lastName("User")
                        .role("CLIENT")
                        .build())
                .build();
    }

    @Test
    void testLoginSuccess() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        ResultActions result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)));

        result.andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mock-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("mock-refresh-token"))
                .andExpect(jsonPath("$.user.email").value("test@solarease.com"));
    }

    @Test
    void testLoginWithInvalidEmail() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResourceNotFoundException("User not found with email: invalid@example.com"));

        ResultActions result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        LoginRequest.builder()
                                .email("invalid@example.com")
                                .password("password123")
                                .build())));

        result.andExpect(status().isNotFound());
    }

    @Test
    void testLoginWithInvalidPassword() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadRequestException("Invalid email or password"));

        ResultActions result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        LoginRequest.builder()
                                .email("test@solarease.com")
                                .password("wrongpassword")
                                .build())));

        result.andExpect(status().isBadRequest());
    }

    @Test
    void testRegisterSuccess() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        ResultActions result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        result.andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("mock-access-token"))
                .andExpect(jsonPath("$.user.email").value("test@solarease.com"));
    }

    @Test
    void testRegisterWithExistingEmail() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BadRequestException("Email already registered"));

        ResultActions result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        result.andExpect(status().isBadRequest());
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/auth/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Identity Service is running"));
    }

    @Test
    void register_Returns400WithFields_WhenEmailInvalid() throws Exception {
        RegisterRequest invalid = RegisterRequest.builder()
                .email("bad-email")
                .username("newuser")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists());
    }

    @Test
    void register_Returns400WithFields_WhenPasswordTooShort() throws Exception {
        RegisterRequest invalid = RegisterRequest.builder()
                .email("newuser@solarease.com")
                .username("newuser")
                .password("12345")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password").exists());
    }
}
