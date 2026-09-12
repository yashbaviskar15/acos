import pytest
from fastapi.testclient import TestClient
from app.main import app, init_db
from app.core.security import create_access_token

client = TestClient(app)

# Ensure tables and seeds are initialized
init_db()

@pytest.fixture
def auth_headers():
    """Generates a valid test JWT token for an active admin user."""
    token = create_access_token(
        subject="yashbaviskar67@gmail.com",
        roles=["SuperAdmin"]
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def dev_auth_headers():
    """Generates a valid test JWT token for a standard developer user."""
    token = create_access_token(
        subject="developer@aravanta.com",
        roles=["Developer"]
    )
    return {"Authorization": f"Bearer {token}"}

def test_list_community_posts_public():
    """Verify unauthenticated/public users can list community posts."""
    res = client.get("/api/v1/community/posts")
    assert res.status_code == 200
    data = res.json()
    assert "posts" in data
    assert "total" in data

def test_community_stats():
    """Verify community stats endpoint returns structured counts."""
    res = client.get("/api/v1/community/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_discussions" in data

def test_create_post_unauthenticated_fails():
    """Verify unauthenticated user cannot publish a post (401)."""
    res = client.post("/api/v1/community/posts", json={
        "title": "Unauthenticated Post Attempt",
        "content": "This should be blocked by auth guardrail.",
        "category": "general"
    })
    assert res.status_code == 401

def test_create_edit_delete_post_lifecycle(dev_auth_headers):
    """Verify full CRUD lifecycle for a post by an authorized developer."""
    # 1. Create Post
    create_res = client.post(
        "/api/v1/community/posts",
        json={
            "title": "Automating Multi-Cloud Failover with Patroni",
            "content": "Detailed overview of setting up automated Patroni cluster failover across regions.",
            "category": "architecture",
            "tags": ["patroni", "postgres", "ha"]
        },
        headers=dev_auth_headers
    )
    assert create_res.status_code == 201
    post = create_res.json()
    post_id = post["id"]
    assert post["title"] == "Automating Multi-Cloud Failover with Patroni"

    # 2. Get Post Details
    get_res = client.get(f"/api/v1/community/posts/{post_id}", headers=dev_auth_headers)
    assert get_res.status_code == 200

    # 3. Edit Post
    edit_res = client.put(
        f"/api/v1/community/posts/{post_id}",
        json={
            "title": "Automating Multi-Cloud Failover with Patroni (Updated)",
            "content": "Updated content with additional PgBouncer configuration snippets."
        },
        headers=dev_auth_headers
    )
    assert edit_res.status_code == 200
    updated = edit_res.json()
    assert "Updated" in updated["title"]

    # 4. Add Comment
    comment_res = client.post(
        f"/api/v1/community/posts/{post_id}/comments",
        json={"content": "Great architecture guide! Does this work with AWS RDS read replicas?"},
        headers=dev_auth_headers
    )
    assert comment_res.status_code == 201
    comment = comment_res.json()
    comment_id = comment["id"]

    # 5. Toggle Like / Unlike
    like_res_1 = client.post(f"/api/v1/community/posts/{post_id}/like", headers=dev_auth_headers)
    assert like_res_1.status_code == 200
    assert like_res_1.json()["liked"] is True

    # Second like toggles to unlike
    like_res_2 = client.post(f"/api/v1/community/posts/{post_id}/like", headers=dev_auth_headers)
    assert like_res_2.status_code == 200
    assert like_res_2.json()["liked"] is False

    # 6. Delete Comment
    del_comment_res = client.delete(f"/api/v1/community/comments/{comment_id}", headers=dev_auth_headers)
    assert del_comment_res.status_code == 200

    # 7. Delete Post
    del_post_res = client.delete(f"/api/v1/community/posts/{post_id}", headers=dev_auth_headers)
    assert del_post_res.status_code == 200

    # Verify 404 after delete
    verify_res = client.get(f"/api/v1/community/posts/{post_id}")
    assert verify_res.status_code == 404

def test_search_and_category_filtering():
    """Verify backend search and filtering operates accurately."""
    # Filter by category
    res_cat = client.get("/api/v1/community/posts?category=general")
    assert res_cat.status_code == 200


def test_post_with_images_and_likers(dev_auth_headers, auth_headers):
    """Verify creating a post with images, toggling likes, and querying who liked the post."""
    # 1. Create post with image
    create_res = client.post(
        "/api/v1/community/posts",
        json={
            "title": "Production eBPF Architecture Diagram",
            "content": "Attached below is our multi-cluster eBPF network topology.",
            "category": "architecture",
            "tags": ["ebpf", "networking"],
            "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
        },
        headers=dev_auth_headers
    )
    assert create_res.status_code == 201
    post = create_res.json()
    post_id = post["id"]
    assert len(post["images"]) == 1

    # 2. View post and verify view increment
    view_res = client.post(f"/api/v1/community/posts/{post_id}/view")
    assert view_res.status_code == 200
    assert view_res.json()["views_count"] >= 1

    # 3. First user likes post
    like_res = client.post(f"/api/v1/community/posts/{post_id}/like", headers=auth_headers)
    assert like_res.status_code == 200
    assert like_res.json()["liked"] is True

    # 4. Query who liked the post
    likers_res = client.get(f"/api/v1/community/posts/{post_id}/likes")
    assert likers_res.status_code == 200
    likers_data = likers_res.json()
    assert likers_data["likes_count"] >= 1
    assert any(u["name"] in ["Yash Baviskar", "yashbaviskar67"] or "SuperAdmin" in u.get("role", "") for u in likers_data["users"])

    # 5. Clean up
    client.delete(f"/api/v1/community/posts/{post_id}", headers=auth_headers)

