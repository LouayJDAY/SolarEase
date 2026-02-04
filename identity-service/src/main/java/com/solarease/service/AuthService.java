package com.solarease.service;

import com.solarease.dto.AuthResponse;
import com.solarease.dto.LoginRequest;
import com.solarease.dto.RegisterRequest;
import com.solarease.entity.User;
import com.solarease.exception.BadRequestException;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.UserRepository;
import com.solarease.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new BadRequestException("User account is inactive");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUuid(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUuid(), user.getEmail());

        AuthResponse.UserDto userDto = buildUserDto(user);

        log.info("User {} logged in successfully", user.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userDto)
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        log.info("Register attempt for email: {}", request.getEmail());
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        User newUser = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(User.UserRole.CLIENT)
                .isActive(true)
                .isEmailVerified(false)
                .build();

        User savedUser = userRepository.save(newUser);

        String accessToken = jwtTokenProvider.generateAccessToken(savedUser.getUuid(), savedUser.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.getUuid(), savedUser.getEmail());

        AuthResponse.UserDto userDto = buildUserDto(savedUser);

        log.info("User {} registered successfully", savedUser.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userDto)
                .build();
    }

    private AuthResponse.UserDto buildUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().toString())
                .build();
    }
}
