package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findBySoulId(String soulId);
    boolean existsByEmail(String email);
    boolean existsBySoulId(String soulId);
}
