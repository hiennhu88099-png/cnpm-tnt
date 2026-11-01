package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.AdminUserResponse;
import com.onlinecourse.backend.dto.response.PageResponse;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.UserStatus;
import com.onlinecourse.backend.service.AdminUserSearchService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users/search")
@RequiredArgsConstructor
public class AdminUserSearchController {

    private final AdminUserSearchService searchService;

    @GetMapping
    public PageResponse<AdminUserResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return searchService.search(
            keyword,
            role,
            status,
            page,
            size
        );
    }
}
