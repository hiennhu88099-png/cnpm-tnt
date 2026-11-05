package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findAllByOrderByPositionAscIdAsc();
    List<Banner> findByActiveTrueOrderByPositionAscIdAsc();
}

