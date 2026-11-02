package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.AdminUserResponse;
import com.onlinecourse.backend.dto.response.PageResponse;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;

import com.onlinecourse.backend.repository.AdminUserQueryRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminUserSearchService {

    private final AdminUserQueryRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> search(
            String keyword,
            Role role,
            UserStatus status,
            int page,
            int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid pagination"
            );
        }

        String text = keyword == null || keyword.isBlank()
            ? null
            : keyword.trim();

        return PageResponse.from(
            userRepository.search(
                text,
                role,
                status,
                PageRequest.of(
                    page,
                    size,
                    Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                    )
                )
            ),
            this::toResponse
        );
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
