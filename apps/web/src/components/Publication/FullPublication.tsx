import UserProfile from '@components/Shared/UserProfile';
import formatTime from '@lib/formatTime';
import getAppName from '@lib/getAppName';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Publication } from 'lens';
import type { FC, Ref } from 'react';
import { useLayoutEffect, useRef } from 'react';

import PublicationActions from './Actions';
import PublicationMenu from './Actions/Menu';
import HiddenPublication from './HiddenPublication';
import PublicationBody from './PublicationBody';
import PublicationStats from './PublicationStats';
import ThreadBody from './ThreadBody';
import PublicationType from './Type';

dayjs.extend(relativeTime);

interface Props {
  publication: Publication;
  postContainerRef?: Ref<HTMLDivElement>;
}

const FullPublication: FC<Props> = ({ publication, postContainerRef }) => {
  const threadRef = useRef<HTMLDivElement>(null);

  const isMirror = publication.__typename === 'Mirror';
  const profile = isMirror ? publication?.mirrorOf?.profile : publication?.profile;
  const timestamp = isMirror ? publication?.mirrorOf?.createdAt : publication?.createdAt;

  const commentOn = publication.__typename === 'Comment' ? (publication?.commentOn as any) : null;
  const mainPost = commentOn && commentOn?.__typename !== 'Mirror' ? commentOn?.mainPost : null;

  // Count check to show the publication stats only if the publication has a comment, like or collect
  const mirrorCount = isMirror
    ? publication?.mirrorOf?.stats?.totalAmountOfMirrors
    : publication?.stats?.totalAmountOfMirrors;
  const reactionCount = isMirror
    ? publication?.mirrorOf?.stats?.totalUpvotes
    : publication?.stats?.totalUpvotes;
  const collectCount = isMirror
    ? publication?.mirrorOf?.stats?.totalAmountOfCollects
    : publication?.stats?.totalAmountOfCollects;
  const showStats = mirrorCount > 0 || reactionCount > 0 || collectCount > 0;

  const isGatedThread = !publication?.isGated && !commentOn?.isGated && !mainPost?.isGated;
  // [...getURLs(mainPost?.metadata.content ?? ''), ...getURLs(commentOn?.metadata.content ?? '')].length ===
  // 0;

  const scrollToThread = () => {
    if ((!mainPost && !commentOn) || !threadRef.current) {
      return;
    }
    if (isGatedThread) {
      threadRef.current?.scrollIntoView({ block: 'start' });
    }
  };

  useLayoutEffect(() => {
    scrollToThread();
  });

  // useLayoutEffect(() => {
  //   scrollToThread();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [threadRef, showOriginalThread]);

  return (
    <article className="p-5">
      {isGatedThread && commentOn ? (
        <div ref={postContainerRef}>
          {mainPost ? <ThreadBody publication={mainPost} /> : null}
          <ThreadBody publication={commentOn} />
        </div>
      ) : (
        <PublicationType publication={publication} showType />
      )}
      <div ref={threadRef} className="scroll-mt-20">
        <div className="flex justify-between pb-4 space-x-1.5">
          {/* @ts-ignore */}
          <UserProfile profile={profile ?? publication?.collectedBy?.defaultProfile} showStatus />
          <PublicationMenu publication={publication} />
        </div>
        <div className="ml-[53px]">
          {publication?.hidden ? (
            <HiddenPublication type={publication.__typename} />
          ) : (
            <>
              <PublicationBody publication={publication} />
              <div className="text-sm lt-text-gray-500 my-3">
                <span title={formatTime(timestamp)}>
                  {dayjs(new Date(timestamp)).format('hh:mm A · MMM D, YYYY')}
                </span>
                {publication?.appId ? <span> · Posted via {getAppName(publication?.appId)}</span> : null}
              </div>
              {showStats && (
                <>
                  <div className="divider" />
                  <PublicationStats publication={publication} />
                </>
              )}
              <div className="divider" />
              <PublicationActions publication={publication} showCount />
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default FullPublication;
