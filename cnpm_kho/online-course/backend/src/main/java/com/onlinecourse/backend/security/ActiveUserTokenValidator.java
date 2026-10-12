package com.onlinecourse.backend.security;

import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import com.onlinecourse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Runs on every authenticated request (after the signature/expiry checks) and rejects a token when
 * the user was deleted, has been blocked, or the token's version is older than the user's
 * (the version is bumped on password change). Costs one primary-key lookup per request.
 */
@Component
@RequiredArgsConstructor
public class ActiveUserTokenValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2TokenValidatorResult INVALID = OAuth2TokenValidatorResult.failure(
            new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN, "Token is no longer valid", null));

    private final UserRepository userRepository;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Optional<User> user = parseUserId(jwt.getSubject()).flatMap(userRepository::findById);
        if (user.isEmpty() || user.get().getStatus() != UserStatus.ACTIVE) {
            return INVALID;
        }

        Object version = jwt.getClaim(JwtService.TOKEN_VERSION_CLAIM);
        if (!(version instanceof Number number) || number.intValue() != user.get().getTokenVersion()) {
            return INVALID;
        }
        return OAuth2TokenValidatorResult.success();
    }

    private Optional<Long> parseUserId(String subject) {
        try {
            return Optional.of(Long.valueOf(subject));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
