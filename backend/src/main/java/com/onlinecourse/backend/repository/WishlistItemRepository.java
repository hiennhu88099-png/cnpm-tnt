package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.course c JOIN FETCH c.category WHERE w.user.id = :userId ORDER BY w.createdAt DESC")
    List<WishlistItem> findByUserIdWithCourse(@Param("userId") Long userId);

    Optional<WishlistItem> findByUserIdAndCourseId(Long userId, Long courseId);

    void deleteByUserIdAndCourseId(Long userId, Long courseId);
}

