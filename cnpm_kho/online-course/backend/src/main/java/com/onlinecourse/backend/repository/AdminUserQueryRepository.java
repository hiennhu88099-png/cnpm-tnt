package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminUserQueryRepository
        extends JpaRepository<User, Long> {

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:status IS NULL OR u.status = :status)
          AND (
              :keyword IS NULL
              OR LOWER(u.fullName) LIKE
                 LOWER(CONCAT('%', :keyword, '%'))
              OR LOWER(u.email) LIKE
                 LOWER(CONCAT('%', :keyword, '%'))
          )
        """)
    Page<User> search(
        @Param("keyword") String keyword,
        @Param("role") Role role,
        @Param("status") UserStatus status,
        Pageable pageable
    );
}
