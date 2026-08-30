package com.kaundega.backend.repository;

import com.kaundega.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindUserByEmail() {
        User user = User.builder().password("password").email("test@example.com").name("Test User").build();
        entityManager.persist(user);
        entityManager.flush();

        Optional<User> found = userRepository.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test User");
    }

    @Test
    void shouldReturnTrueIfExistsByEmail() {
        User user = User.builder().password("password").email("exists@example.com").name("Exist User").build();
        entityManager.persist(user);
        entityManager.flush();

        boolean exists = userRepository.existsByEmail("exists@example.com");

        assertThat(exists).isTrue();
    }
}
