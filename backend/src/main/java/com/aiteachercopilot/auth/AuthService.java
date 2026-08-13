package com.aiteachercopilot.auth;

import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service — handles registration and login.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Register a new teacher account.
     */
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role("TEACHER")
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthDto.AuthResponse(token, user.getEmail(),
                user.getFullName(), user.getRole());
    }

    /**
     * Authenticate with email and password, return JWT token.
     */
    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        log.info("User logged in: {}", user.getEmail());

        return new AuthDto.AuthResponse(token, user.getEmail(),
                user.getFullName(), user.getRole());
    }
}
