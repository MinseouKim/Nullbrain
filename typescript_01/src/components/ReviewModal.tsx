import React, { useState } from "react";
import styled from "styled-components";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: {
    rating: number;
    content: string;
    exerciseType: string;
    image?: File;
  }) => void;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: #f0f0f0;
    color: #666;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow: visible;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const ExerciseSelect = styled.select`
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #860000;
  }
`;

const StarRatingContainer = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
`;

const StarButton = styled.button<{ filled: boolean }>`
  background: none;
  border: none;
  font-size: 24px;
  color: ${(props) => (props.filled ? "#FFD700" : "#ddd")};
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #ffd700;
  }
`;

const RatingText = styled.span`
  margin-left: 10px;
  font-size: 16px;
  color: #666;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  max-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #860000;
  }

  &::placeholder {
    color: #999;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 5px;
  flex-shrink: 0;
`;

const CancelButton = styled.button`
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #e0e0e0;
    color: #333;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ImageUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ImageUploadArea = styled.div<{ hasImage: boolean }>`
  border: 2px dashed ${(props) => (props.hasImage ? "#860000" : "#ddd")};
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.hasImage ? "#f8f8f8" : "#fafafa")};
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: #860000;
    background: #f8f8f8;
  }
`;

const ImageUploadText = styled.div`
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
`;

const ImageUploadButton = styled.button`
  background: #860000;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;

  &:hover {
    background: #6b0000;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 10px;
`;

const PreviewImage = styled.img`
  width: 100%;
  max-width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ImageInfo = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 5px;
`;

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [exerciseType, setExerciseType] = useState("스쿼트");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const exerciseOptions = [
    "스쿼트",
    "플랭크",
    "풀업",
    "런지",
    "벤치프레스",
    "데드리프트",
    "달리기",
  ];

  // 이미지 파일 검증
  const validateImage = (file: File): boolean => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > maxSize) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return false;
    }

    return true;
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateImage(file)) {
      setSelectedImage(file);

      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 이미지 업로드 영역 클릭 핸들러
  const handleUploadAreaClick = () => {
    document.getElementById("image-upload")?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || content.trim() === "") {
      alert("별점과 후기 내용을 모두 입력해주세요.");
      return;
    }

    onSubmit({
      rating,
      content: content.trim(),
      exerciseType,
      image: selectedImage || undefined,
    });

    // 폼 초기화
    setRating(0);
    setContent("");
    setExerciseType("스쿼트");
    setSelectedImage(null);
    setImagePreview(null);
    onClose();
  };

  const handleClose = () => {
    setRating(0);
    setContent("");
    setExerciseType("스쿼트");
    setSelectedImage(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>후기 작성하기</ModalTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>운동 종류</Label>
            <ExerciseSelect
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
            >
              {exerciseOptions.map((exercise) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </ExerciseSelect>
          </FormGroup>

          <FormGroup>
            <Label>후기 내용</Label>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자세ON을 사용해보신 소감을 자유롭게 작성해주세요..."
              maxLength={500}
            />
            <div
              style={{ textAlign: "right", fontSize: "14px", color: "#999" }}
            >
              {content.length}/500
            </div>
          </FormGroup>

          <FormGroup>
            <Label>사진 첨부 (선택사항)</Label>
            <ImageUploadContainer>
              <ImageUploadArea
                hasImage={!!imagePreview}
                onClick={handleUploadAreaClick}
              >
                {imagePreview ? (
                  <ImagePreview>
                    <PreviewImage src={imagePreview} alt="미리보기" />
                    <RemoveImageButton onClick={handleRemoveImage}>
                      ×
                    </RemoveImageButton>
                  </ImagePreview>
                ) : (
                  <>
                    <ImageUploadText>📷 사진을 첨부해주세요</ImageUploadText>
                    <ImageUploadButton type="button">
                      사진 선택
                    </ImageUploadButton>
                  </>
                )}
              </ImageUploadArea>
              <FileInput
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />
              <ImageInfo>지원 형식: JPEG, PNG, GIF, WebP (최대 5MB)</ImageInfo>
            </ImageUploadContainer>
          </FormGroup>

          <FormGroup>
            <Label>별점</Label>
            <StarRatingContainer>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarButton
                  key={star}
                  type="button"
                  filled={star <= rating}
                  onClick={() => setRating(star)}
                >
                  ★
                </StarButton>
              ))}
              <RatingText>
                {rating === 0 ? "별점을 선택해주세요" : `${rating}점`}
              </RatingText>
            </StarRatingContainer>
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={handleClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit">후기 등록</SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ReviewModal;
