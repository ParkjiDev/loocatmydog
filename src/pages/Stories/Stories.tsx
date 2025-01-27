import pb from '@/api/pocketbase';
import ButtonPlus from '@/components/atoms/ButtonPlus/ButtonPlus';
import StoryCard from '@/components/molecules/StoryCard/StoryCard';
import Tab from '@/components/molecules/Tab/Tab';
import { useAuthStore } from '@/store/useAuthStore';
import getPbImageURL from '@/utils/getPbImageURL';
import { RecordModel } from 'pocketbase';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Expand {
  [key: string]: any;
}

interface Boards {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  type: string;
  textContent: string;
  photo: string[];
  productId: string;
  rate: number;
  expand: Expand;
}

const StyledStories = styled.div`
  inline-size: 100%;
  block-size: 100%;
  position: relative;

  & ul {
    block-size: 100%;
  }
`;

// 서버 통신으로 모든 스토리 읽어오기
const readStory = async () => {
  try {
    const record: RecordModel[] = await pb
      .collection('boards')
      .getFullList<Boards>({
        filter: `type = "stories"`,
        expand: 'userId',
      });
    console.log(record);

    const storyList = record.map((data, index) => {
      const { id, userId, collectionId, expand, textContent, photo, created } =
        data;

      const expandUserData = (expand as Expand).userId;

      const date = new Date(created);
      const time = date.getTime();
      let profileImage = '/images/profileNone.svg';
      if (expandUserData.avatar !== '') {
        profileImage = getPbImageURL(
          expandUserData.collectionId,
          expandUserData.id,
          expandUserData.avatar
        );
      }

      const imageUrls = photo.map((url: string) =>
        getPbImageURL(collectionId, id, url)
      );

      return (
        <StoryCard
          key={index}
          id={id}
          userId={userId}
          username={expandUserData.name}
          profileImageUrl={profileImage}
          type={'story'}
          text={textContent}
          attachImageUrl={imageUrls}
          createdDate={time}
        />
      );
    });

    return storyList;
  } catch (error) {
    console.log('///// Server Error: ', error);
  }
};

const Stories = () => {
  // 로그인 유저 정보
  const currentUserData = useAuthStore.getState().user;
  const currentUserId = currentUserData?.id;

  // 렌더링 모드 상태
  const [modeState, setModeState] = useState<'front' | 'after'>('front');

  // 필터링 후 렌더링을 위한 상태
  const [storyList, setStoryList] = useState<React.JSX.Element[]>([]);

  // 모든 스토리를 저장하는 공간
  const serverStoryList = useRef<React.JSX.Element[]>([]);

  // 렌더링 모드 변경 이벤트
  const handleMode = () => {
    if (modeState === 'front') {
      setModeState('after');
    } else {
      setModeState('front');
    }
  };

  // 첫번째 렌더링 storyList에 저장
  useEffect(() => {
    readStory()
      .then((list) => {
        serverStoryList.current = list as React.JSX.Element[];
        console.log(serverStoryList.current[0].props.userId);
        setStoryList([...storyList, ...serverStoryList.current]);
      })
      .catch((error) => {
        console.log('///// error: ', error);
      });
  }, []);

  // mode 변경에 대한 렌더링
  useEffect(() => {
    switch (modeState) {
      case 'front':
        setStoryList(serverStoryList.current);
        break;
      case 'after':
        {
          const currentList = serverStoryList.current;
          if (currentList) {
            const filteringList = currentList.filter((element) => {
              const elementUserId = element.props.userId;
              return elementUserId === currentUserId;
            });
            setStoryList(filteringList);
          }
        }
        break;
    }
  }, [modeState]);

  return (
    <StyledStories>
      <Tab
        mode={modeState}
        front={'스토리'}
        after={'내가 쓴 글'}
        onClick={handleMode}
      />
      <div className="storyContainer">{storyList}</div>
      <ButtonPlus path={'/stories/post'} />
    </StyledStories>
  );
};

export default Stories;
