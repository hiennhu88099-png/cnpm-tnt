package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.AdminUserResponse;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import com.onlinecourse.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
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