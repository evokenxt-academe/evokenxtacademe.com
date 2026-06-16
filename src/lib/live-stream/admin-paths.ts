export function courseLiveStreamsPath(courseId: string) {
  return `/admin/courses/${courseId}/live-streams`;
}

export function streamControlPath(courseId: string, streamId: string) {
  return `/admin/courses/${courseId}/live-streams/${streamId}/control`;
}

export function streamEditPath(courseId: string, streamId: string) {
  return `/admin/courses/${courseId}/live-streams/${streamId}/edit`;
}

export function streamAnalyticsPath(courseId: string, streamId: string) {
  return `/admin/courses/${courseId}/live-streams/${streamId}/analytics`;
}

export function streamChatPath(courseId: string, streamId: string) {
  return `/admin/courses/${courseId}/live-streams/${streamId}/chat`;
}
