package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("SELECT c FROM CartItem c JOIN FETCH c.course co JOIN FETCH co.category WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    List<CartItem> findByUserIdWithCourse(@Param("userId") Long userId);

    Optional<CartItem> findByUserIdAndCourseId(Long userId, Long courseId);

    void deleteByUserIdAndCourseId(Long userId, Long courseId);

    void deleteByUserIdAndCourseIdIn(Long userId, List<Long> courseIds);

    void deleteByUserId(Long userId);
}

