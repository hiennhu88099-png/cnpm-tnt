package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.CourseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseOrderRepository extends JpaRepository<CourseOrder, Long> {

    @Query("SELECT o FROM CourseOrder o JOIN FETCH o.user WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<CourseOrder> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT o FROM CourseOrder o JOIN FETCH o.user ORDER BY o.createdAt DESC")
    List<CourseOrder> findAllWithUserOrderByCreatedAtDesc();

    @Query("SELECT o FROM CourseOrder o JOIN FETCH o.user WHERE o.orderCode = :orderCode")
    Optional<CourseOrder> findByOrderCodeWithUser(@Param("orderCode") String orderCode);

    @Query("SELECT o FROM CourseOrder o JOIN FETCH o.user WHERE o.status = 'PENDING' ORDER BY o.createdAt DESC")
    List<CourseOrder> findAllPendingWithUser();

    boolean existsByOrderCode(String orderCode);
}

