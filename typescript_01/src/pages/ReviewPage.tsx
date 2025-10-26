import React, { useState } from "react";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewModal from "../components/ReviewModal";

// 후기 데이터 타입 정의
interface Review {
  id: number;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  exerciseType?: string;
  imageUrl?: string;
}

// 더미 데이터
const dummyReviews: Review[] = [
  {
    id: 1,
    userId: "KKK****",
    rating: 4.5,
    content:
      "제 스쿼트 자세가 안좋다는 걸 알게 되었네요! 무릎를 과도하게 사용하고 있는지 바로바로 알 수 있었습니다!",
    createdAt: "2024-01-15",
    exerciseType: "스쿼트",
    imageUrl: "/images/squat.png",
  },
  {
    id: 2,
    userId: "LLL****",
    rating: 5.0,
    content:
      "플랭크 자세 교정이 정말 도움이 됐어요! 첨부한 사진처럼 이제 완벽한 자세로 할 수 있게 되었습니다!",
    createdAt: "2024-01-14",
    exerciseType: "플랭크",
    imageUrl: "/images/plank.png",
  },
  {
    id: 3,
    userId: "MMM****",
    rating: 4.0,
    content:
      "실시간 피드백이 정말 도움이 됐어요. 혼자 운동할 때도 안전하게 할 수 있게 되었습니다.",
    createdAt: "2024-01-13",
    exerciseType: "데드리프트",
    imageUrl: "/images/deadlift.png",
  },
  {
    id: 4,
    userId: "NNN****",
    rating: 5.0,
    content:
      "AI가 정확하게 자세를 분석해주니까 운동 효과가 확실히 달라졌어요! 사진처럼 올바른 자세를 유지할 수 있게 되었습니다.",
    createdAt: "2024-01-12",
    exerciseType: "런지",
    imageUrl: "/images/lunge.png",
  },
  {
    id: 5,
    userId: "OOO****",
    rating: 4.5,
    content:
      "처음에는 어려웠는데 점점 자세가 좋아지는 게 보여서 뿌듯해요. 첨부한 사진이 증거입니다!",
    createdAt: "2024-01-11",
    exerciseType: "풀업",
    imageUrl: "/images/pullup.png",
  },
  {
    id: 6,
    userId: "PPP****",
    rating: 5.0,
    content:
      "벤치프레스 자세가 완전히 바뀌었어요! 첨부한 사진처럼 이제 안전하고 효과적으로 운동할 수 있습니다.",
    createdAt: "2024-01-10",
    exerciseType: "벤치프레스",
    imageUrl: "/images/benchPress.png",
  },
  {
    id: 7,
    userId: "QQQ****",
    rating: 4.5,
    content:
      "달리기 자세도 교정이 필요하다는 걸 알게 되었네요. 사진처럼 올바른 자세로 달릴 수 있게 되었습니다!",
    createdAt: "2024-01-09",
    exerciseType: "달리기",
    imageUrl: "/images/running.png",
  },
  {
    id: 8,
    userId: "RRR****",
    rating: 4.0,
    content: "자세ON 덕분에 운동 부상을 예방할 수 있었어요. 정말 감사합니다!",
    createdAt: "2024-01-08",
    exerciseType: "스쿼트",
  },
];

const Container = styled.div`
  margin: 0 auto;
  padding: 0;
  text-align: center;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const MainHeader = styled.div`
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("/images/main6.png") center/cover no-repeat;
    opacity: 0.1;
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 36px;
  }

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    font-size: 18px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
`;

const StatsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
`;

const StatsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ReviewCount = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
`;

const Divider = styled.div`
  width: 1px;
  height: 30px;
  background: #ddd;

  @media (max-width: 768px) {
    display: none;
  }
`;

const StatsDescription = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
`;

const SortSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const SortButton = styled.button`
  background: #8b4513;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: #a0522d;
  }
`;

const SortOptions = styled.div`
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: #666;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ReviewCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ReviewImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  @media (max-width: 768px) {
    max-width: 100%;
    height: 200px;
  }
`;

const ProfileImage = styled.div`
  width: 60px;
  height: 60px;
  background: #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  flex-shrink: 0;
`;

const ReviewContent = styled.div`
  flex: 1;
  text-align: left;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const StarRating = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${(props) => (props.filled ? "#FFD700" : "#ddd")};
  font-size: 18px;
`;

const UserId = styled.span`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const ReviewText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 10px 0;
`;

const ReviewMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #999;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 5px;
  }
`;

const ExerciseType = styled.span`
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
`;

const WriteReviewButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(134, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(134, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    font-size: 14px;
  }
`;

const ReviewPage = () => {
  const [reviews, setReviews] = useState<Review[]>(dummyReviews);
  const [sortBy, setSortBy] = useState<"rating-high" | "rating-low" | "latest">(
    "latest"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 정렬 함수
  const sortReviews = (reviews: Review[], sortType: string) => {
    const sorted = [...reviews];
    switch (sortType) {
      case "rating-high":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "rating-low":
        return sorted.sort((a, b) => a.rating - b.rating);
      case "latest":
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return sorted;
    }
  };

  // 정렬된 리뷰
  const sortedReviews = sortReviews(reviews, sortBy);

  // 별점 렌더링 함수
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} filled={i <= rating}>
          ★
        </Star>
      );
    }
    return stars;
  };

  const handleWriteReview = () => {
    setIsModalOpen(true);
  };

  const handleSubmitReview = (reviewData: {
    rating: number;
    content: string;
    exerciseType: string;
    image?: File;
  }) => {
    // 이미지가 있으면 URL 생성 (실제로는 서버에 업로드 후 URL을 받아야 함)
    let imageUrl: string | undefined;
    if (reviewData.image) {
      imageUrl = URL.createObjectURL(reviewData.image);
    }

    const newReview: Review = {
      id: reviews.length + 1,
      userId: "사용자****",
      rating: reviewData.rating,
      content: reviewData.content,
      createdAt: new Date().toISOString().split("T")[0],
      exerciseType: reviewData.exerciseType,
      imageUrl,
    };

    setReviews((prev) => [newReview, ...prev]);
    alert("후기가 성공적으로 등록되었습니다!");
  };

  return (
    <Container>
      <Header />

      <MainHeader>
        <HeaderTitle>자세ON과 함께한 사람들의 이야기를 만나보세요</HeaderTitle>
        <HeaderSubtitle>
          실제 사용자들의 생생한 후기를 확인해보세요
        </HeaderSubtitle>
      </MainHeader>

      <ContentContainer>
        <StatsSection>
          <StatsLeft>
            <ReviewCount>후기 {reviews.length}건</ReviewCount>
            <Divider />
            <StatsDescription>
              자세ON 이용자분들의 소중한 후기입니다.
            </StatsDescription>
          </StatsLeft>

          <SortSection>
            <SortButton onClick={() => setSortBy("latest")}>정렬</SortButton>
            <SortOptions>
              <span
                style={{
                  cursor: "pointer",
                  color: sortBy === "rating-high" ? "#860000" : "#666",
                  fontWeight: sortBy === "rating-high" ? "bold" : "normal",
                }}
                onClick={() => setSortBy("rating-high")}
              >
                별점 높은순
              </span>
              <span> | </span>
              <span
                style={{
                  cursor: "pointer",
                  color: sortBy === "rating-low" ? "#860000" : "#666",
                  fontWeight: sortBy === "rating-low" ? "bold" : "normal",
                }}
                onClick={() => setSortBy("rating-low")}
              >
                별점 낮은순
              </span>
              <span> | </span>
              <span
                style={{
                  cursor: "pointer",
                  color: sortBy === "latest" ? "#860000" : "#666",
                  fontWeight: sortBy === "latest" ? "bold" : "normal",
                }}
                onClick={() => setSortBy("latest")}
              >
                최신순
              </span>
            </SortOptions>
          </SortSection>
        </StatsSection>

        <ReviewList>
          {sortedReviews.map((review) => (
            <ReviewCard key={review.id}>
              <ProfileImage>👤</ProfileImage>
              <ReviewContent>
                <ReviewHeader>
                  <StarRating>{renderStars(review.rating)}</StarRating>
                  <UserId>{review.userId}</UserId>
                </ReviewHeader>
                <ReviewText>{review.content}</ReviewText>
                {review.imageUrl && (
                  <ReviewImage
                    src={review.imageUrl}
                    alt="후기 이미지"
                    onClick={() => window.open(review.imageUrl, "_blank")}
                  />
                )}
                <ReviewMeta>
                  <ExerciseType>{review.exerciseType}</ExerciseType>
                  <span>{review.createdAt}</span>
                </ReviewMeta>
              </ReviewContent>
            </ReviewCard>
          ))}
        </ReviewList>
      </ContentContainer>

      <WriteReviewButton onClick={handleWriteReview}>
        후기 작성하기
      </WriteReviewButton>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitReview}
      />

      <Footer />
    </Container>
  );
};

export default ReviewPage;
