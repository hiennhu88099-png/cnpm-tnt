package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.ChangePasswordRequest;
import com.onlinecourse.backend.dto.request.UpdateProfileRequest;
import com.onlinecourse.backend.dto.response.UserResponse;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import com.onlinecourse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserResponse.from(findUser(id));
    }

    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        User user = findUser(id);
        user.setFullName(request.getFullName().trim());
        user.setPhone(blankToNull(request.getPhone()));
        user.setAvatar(blankToNull(request.getAvatar()));
        // saveAndFlush so the returned updatedAt reflects this update
        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = findUser(id);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new FieldValidationException("currentPassword", "Current password is incorrect");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new FieldValidationException("confirmPassword", "Confirm password does not match");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new FieldValidationException("newPassword", "New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
