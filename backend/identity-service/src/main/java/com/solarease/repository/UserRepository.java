package com.solarease.repository;

import com.solarease.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByUuid(String uuid);
    List<User> findAllByRole(User.UserRole role);
    Boolean existsByEmail(String email);
    Boolean existsByUsername(String username);
}
