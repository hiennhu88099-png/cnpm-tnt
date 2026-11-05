package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.AdminUserUpsertRequest;
import com.onlinecourse.backend.dto.response.AdminUserResponse;
import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import com.onlinecourse.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(AdminUserUpsertRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email khong duoc de trong");
        }
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email nay da ton tai trong he thong");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau phai tu 6 ky tu tro len");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(request.fullName().trim())
                .phone(request.phone() != null && !request.phone().isBlank() ? request.phone().trim() : null)
                .avatar("/default-avatar.png")
                .password(passwordEncoder.encode(request.password()))
                .role(request.role() != null ? request.role() : Role.USER)
                .status(request.status() != null ? request.status() : UserStatus.ACTIVE)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse updateUser(Long id, AdminUserUpsertRequest request, Long adminId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay nguoi dung"
                ));

        if (user.getId().equals(adminId)) {
            if (request.status() == UserStatus.BLOCKED) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Khong the tu khoa tai khoan cua minh"
                );
            }
            if (request.role() != null && request.role() != Role.ADMIN) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Khong the tu ha quyen tai khoan Admin cua minh"
                );
            }
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        user.setPhone(request.phone() != null && !request.phone().isBlank() ? request.phone().trim() : null);

        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.newPassword().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau moi phai tu 6 ky tu tro len");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
            user.setTokenVersion(user.getTokenVersion() + 1);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse updateStatus(
            Long id,
            UserStatus status,
            Long adminId) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay nguoi dung"
                ));

        if (user.getId().equals(adminId)
                && status == UserStatus.BLOCKED) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khong the tu khoa tai khoan cua minh"
            );
        }

        user.setStatus(status);

        user = userRepository.save(user);

        return toResponse(user);
    }

    private AdminUserResponse toResponse(User user) {

        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
