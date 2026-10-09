'use client';
import React from 'react';
import { AdminShell } from '../../src/components/layout/admin-shell';
import { FeedbackTriageDashboard } from '../../src/components/feedback/feedback-triage-dashboard';
export default function FeedbackPage() { return <AdminShell><FeedbackTriageDashboard /></AdminShell>; }
