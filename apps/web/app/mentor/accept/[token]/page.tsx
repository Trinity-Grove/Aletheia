import { MentorGrantAcceptView } from '../../../../src/components/mentors/mentor-grant-accept-view';

export default async function MentorAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MentorGrantAcceptView token={token} />;
}
