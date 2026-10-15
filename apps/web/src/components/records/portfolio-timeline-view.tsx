'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AletheiaIcon, Card, EmptyState } from '@aletheia/ui';
import type { LearningRecordResponseDto, PortfolioItemResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

type TimelineEventKind = 'photo' | 'memory' | 'reflection' | 'book' | 'milestone';

interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  date: string;
  title: string;
  body: string | null;
  portfolioItem?: PortfolioItemResponseDto;
}

export interface PortfolioTimelineViewProps {
  items: PortfolioItemResponseDto[];
  records: LearningRecordResponseDto[];
  activeLearnerId?: string | null;
  onResolveMediaUrl?(itemId: string): Promise<string | null>;
}

function getRecordBody(record: LearningRecordResponseDto): string | null {
  return [record.notes, record.description, record.strengths, record.characterHabitGrowth, record.areasForGrowth]
    .find((value) => Boolean(value?.trim())) ?? null;
}

function getRecordKind(record: LearningRecordResponseDto): TimelineEventKind {
  if (record.type === 'READING_LOG' && (record.masteryLevel === 'MASTERED' || record.masteryLevel === 'AUTONOMOUS')) return 'book';
  if (record.masteryLevel === 'MASTERED') return 'milestone';
  if (getRecordBody(record)) return 'reflection';
  return 'memory';
}

function eventDate(event: TimelineEvent): number {
  const timestamp = Date.parse(event.date);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function EventIcon({ kind }: { kind: TimelineEventKind }) {
  if (kind === 'book') return <AletheiaIcon name="book-open" size={18} />;
  if (kind === 'milestone') return <AletheiaIcon name="check-circle-2" size={18} />;
  if (kind === 'reflection') return <AletheiaIcon name="pen-line" size={18} />;
  if (kind === 'photo') return <AletheiaIcon name="image" size={18} />;
  return <AletheiaIcon name="folder-heart" size={18} />;
}

export function PortfolioTimelineView({
  items,
  records,
  activeLearnerId = null,
  onResolveMediaUrl,
}: PortfolioTimelineViewProps) {
  const { t, formatDate } = useLocale();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [visiblePhotoIds, setVisiblePhotoIds] = useState<string[]>([]);
  const photoNodes = useRef(new Map<string, HTMLElement>());
  const requestedPhotoIds = useRef(new Set<string>());

  const events = useMemo(() => {
    const selectedItems = activeLearnerId ? items.filter((item) => item.learnerId === activeLearnerId) : items;
    const selectedRecords = activeLearnerId ? records.filter((record) => record.learnerId === activeLearnerId) : records;
    const itemEvents: TimelineEvent[] = selectedItems.map((item) => ({
      id: item.id,
      kind: item.type === 'IMAGE' ? 'photo' : 'memory',
      date: item.capturedAt ?? item.createdAt,
      title: item.title,
      body: item.description ?? item.textContent ?? null,
      portfolioItem: item,
    }));
    const recordEvents: TimelineEvent[] = selectedRecords
      .filter((record) => record.portfolioItemIds.length === 0 || record.type === 'READING_LOG' || record.masteryLevel === 'MASTERED' || Boolean(getRecordBody(record)))
      .map((record) => ({
        id: record.id,
        kind: getRecordKind(record),
        date: record.date,
        title: record.title,
        body: getRecordBody(record),
      }));

    return [...itemEvents, ...recordEvents].sort((left, right) => eventDate(right) - eventDate(left));
  }, [activeLearnerId, items, records]);

  useEffect(() => {
    setVisiblePhotoIds([]);
    requestedPhotoIds.current.clear();
    setMediaUrls({});
  }, [activeLearnerId]);

  useEffect(() => {
    const photos = events.filter((event) => event.kind === 'photo' && event.portfolioItem);
    if (photos.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisiblePhotoIds(photos.slice(0, 4).map((event) => event.portfolioItem!.id));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const visibleIds = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => (entry.target as HTMLElement).dataset.photoId)
        .filter((id): id is string => Boolean(id));
      if (visibleIds.length > 0) setVisiblePhotoIds((current) => [...new Set([...current, ...visibleIds])]);
    }, { rootMargin: '160px' });
    photos.forEach((event) => {
      const node = photoNodes.current.get(event.portfolioItem!.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [events]);

  useEffect(() => {
    if (!onResolveMediaUrl) return;
    let cancelled = false;
    void Promise.all(
      visiblePhotoIds.map(async (id) => {
        if (requestedPhotoIds.current.has(id)) return;
        requestedPhotoIds.current.add(id);
        const url = await onResolveMediaUrl(id);
        if (!cancelled && url) setMediaUrls((current) => ({ ...current, [id]: url }));
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [onResolveMediaUrl, visiblePhotoIds]);

  const groups = useMemo(() => {
    const byYear = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const year = event.date.slice(0, 4) || '—';
      const group = byYear.get(year) ?? [];
      group.push(event);
      byYear.set(year, group);
    }
    return [...byYear.entries()];
  }, [events]);

  if (events.length === 0) {
    return (
      <EmptyState
        data-testid="portfolio-timeline-empty"
        icon={<AletheiaIcon name="folder-heart" size={40} style={{ color: 'var(--forest)' }} />}
        title={t('records.portfolio.timeline.emptyTitle')}
        description={t('records.portfolio.timeline.emptyDescription')}
      />
    );
  }

  return (
    <div className="portfolio-timeline" data-testid="portfolio-timeline">
      <div className="portfolio-timeline__legend" aria-label={t('records.portfolio.timeline.legendLabel')}>
        {(['photo', 'reflection', 'book', 'milestone'] as TimelineEventKind[]).map((kind) => (
          <span className={`portfolio-timeline__legend-item portfolio-timeline__legend-item--${kind}`} key={kind}>
            <EventIcon kind={kind} /> {t(`records.portfolio.timeline.kinds.${kind}`)}
          </span>
        ))}
      </div>
      {groups.map(([year, yearEvents]) => (
        <section className="portfolio-timeline__year" key={year} data-testid={`timeline-year-${year}`}>
          <h3 className="portfolio-timeline__year-title">{year}</h3>
          <div className="portfolio-timeline__events">
            {yearEvents.map((event) => {
              const photoUrl = event.portfolioItem ? mediaUrls[event.portfolioItem.id] : undefined;
              return (
                <article
                  className={`portfolio-timeline__event portfolio-timeline__event--${event.kind}`}
                  data-testid={`timeline-event-${event.id}`}
                  ref={event.kind === 'photo' && event.portfolioItem ? (node) => {
                    if (node) photoNodes.current.set(event.portfolioItem!.id, node);
                    else photoNodes.current.delete(event.portfolioItem!.id);
                  } : undefined}
                  key={`${event.kind}-${event.id}`}
                >
                  <div className="portfolio-timeline__marker" aria-hidden="true"><EventIcon kind={event.kind} /></div>
                  <Card className="portfolio-timeline__card" shadow="sm">
                    <div className="portfolio-timeline__card-header">
                      <span className="portfolio-timeline__kind">{t(`records.portfolio.timeline.kinds.${event.kind}`)}</span>
                      <time dateTime={event.date}>{formatDate(event.date)}</time>
                    </div>
                    <h4>{event.title}</h4>
                    {event.body && <p>{event.body}</p>}
                    {photoUrl && (
                      <img className="portfolio-timeline__photo" src={photoUrl} alt={event.title} loading="lazy" />
                    )}
                  </Card>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
