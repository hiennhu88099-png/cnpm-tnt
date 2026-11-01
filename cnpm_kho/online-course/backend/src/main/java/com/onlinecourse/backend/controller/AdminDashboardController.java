package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.DashboardSummaryResponse;
import com.onlinecourse.backend.service.DashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {

        return dashboardService.summary();
    }
}
