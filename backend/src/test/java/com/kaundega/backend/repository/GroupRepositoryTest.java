package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class GroupRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private GroupRepository groupRepository;

    @Test
    void shouldFindGroupByCreatedById() {
        User user = User.builder().password("password").email("creator@example.com").name("Creator").build();
        entityManager.persist(user);

        Group group = Group.builder().name("Trip").createdBy(user).build();
        entityManager.persist(group);
        entityManager.flush();

        List<Group> groups = groupRepository.findByCreatedById(user.getId());

        assertThat(groups).hasSize(1);
        assertThat(groups.get(0).getName()).isEqualTo("Trip");
    }

    @Test
    void shouldFindGroupByMembersContains() {
        User creator = User.builder().password("password").email("creator@example.com").name("Creator").build();
        User member = User.builder().password("password").email("member@example.com").name("Member").build();
        entityManager.persist(creator);
        entityManager.persist(member);

        Group group = Group.builder().name("Roommates").createdBy(creator).members(List.of(member)).build();
        entityManager.persist(group);
        entityManager.flush();

        List<Group> groups = groupRepository.findByMembersContains(member);

        assertThat(groups).hasSize(1);
        assertThat(groups.get(0).getName()).isEqualTo("Roommates");
    }
}
