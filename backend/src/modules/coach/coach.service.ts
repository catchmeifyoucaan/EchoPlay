import { Injectable } from '@nestjs/common';
import { DebateRound, MatchParticipant, Vote } from '@prisma/client';

import { CoachFeedbackDto } from './dto/coach-feedback.dto';
import { TranscribeDto } from './dto/transcribe.dto';

interface EvaluateMatchArgs {
  matchId: string;
  rounds: DebateRound[];
  votes: Vote[];
  participants: MatchParticipant[];
}

interface EvaluationDetail {
  metric: string;
  score: number;
  summary: string;
}

interface MatchEvaluationResult {
  score: number;
  winnerUserId: string | null;
  summary: string;
  details: EvaluationDetail[];
}

@Injectable()
export class CoachService {
  async getFeedback(dto: CoachFeedbackDto) {
    const civilityScore = this.estimateCivility(dto.transcript);
    const strengths = this.extractStrengths(dto.transcript);
    const opportunities = this.extractOpportunities(dto.transcript);

    return {
      civility: civilityScore,
      summary: this.buildSummary(civilityScore, strengths, opportunities),
      strengths,
      opportunities,
      transcriptEcho: dto
    };
  }

  async transcribe(dto: TranscribeDto) {
    return {
      text: 'Transcription service not yet configured. Uploads are queued.',
      language: dto.language ?? 'en',
      audioUrl: dto.audioUrl
    };
  }

  async evaluateMatch(args: EvaluateMatchArgs): Promise<MatchEvaluationResult> {
    const voteTotals = this.countVotes(args.votes);
    const speakingDurations = this.calculateDurations(args.rounds);

    const participantsScores = args.participants.map((participant) => {
      const votes = voteTotals.get(participant.userId) ?? 0;
      const speakingSeconds = speakingDurations.get(participant.userId) ?? 0;
      const speakingScore = Math.min(30, Math.round(speakingSeconds / 10));
      const voteScore = Math.min(60, votes * 10);
      const collaborationBonus = participant.side ? 5 : 0;
      const totalScore = 40 + speakingScore + voteScore + collaborationBonus;

      return {
        userId: participant.userId,
        totalScore,
        votes,
        speakingSeconds
      };
    });

    participantsScores.sort((a, b) => b.totalScore - a.totalScore);
    const winner = participantsScores[0];
    const runnerUp = participantsScores[1];

    const summary = winner
      ? `Audience favored ${winner.userId} with ${winner.votes} votes and ${winner.speakingSeconds}s of spotlight.`
      : 'No participants recorded for this match.';

    const details: EvaluationDetail[] = participantsScores.map((participant) => ({
      metric: participant.userId,
      score: participant.totalScore,
      summary: `${participant.votes} votes • ${participant.speakingSeconds}s speaking time`
    }));

    const baseScore = winner ? winner.totalScore : 0;
    const balanceModifier = runnerUp ? Math.max(0, 15 - Math.abs(winner.totalScore - runnerUp.totalScore)) : 0;
    const finalScore = Math.min(100, baseScore + balanceModifier);

    return {
      score: finalScore,
      winnerUserId: winner?.userId ?? null,
      summary,
      details
    };
  }

  private countVotes(votes: Vote[]) {
    const counts = new Map<string, number>();
    for (const vote of votes) {
      counts.set(vote.forUserId, (counts.get(vote.forUserId) ?? 0) + 1);
    }
    return counts;
  }

  private calculateDurations(rounds: DebateRound[]) {
    const totals = new Map<string, number>();
    for (const round of rounds) {
      if (!round.startedAt) {
        continue;
      }
      const end = round.endedAt ?? new Date();
      const duration = Math.max(0, (end.getTime() - round.startedAt.getTime()) / 1000);
      totals.set(round.speakerId, (totals.get(round.speakerId) ?? 0) + duration);
    }
    return totals;
  }

  private estimateCivility(transcript: string) {
    const lower = transcript.toLowerCase();
    const negativePhrases = ['hate', 'stupid', 'idiot', 'shut up'];
    const infractions = negativePhrases.reduce((count, phrase) => (lower.includes(phrase) ? count + 1 : count), 0);
    return Math.max(20, 95 - infractions * 15);
  }

  private extractStrengths(transcript: string) {
    const strengths: string[] = [];
    if (transcript.includes('because') || transcript.includes('for example')) {
      strengths.push('Provides supporting evidence');
    }
    if (transcript.includes('we') || transcript.includes('together')) {
      strengths.push('Collaborative tone');
    }
    if (transcript.length > 240) {
      strengths.push('Sustained argumentation');
    }
    return strengths.length ? strengths : ['Clear delivery'];
  }

  private extractOpportunities(transcript: string) {
    const opportunities: string[] = [];
    if (!transcript.includes('?')) {
      opportunities.push('Invite the other side with a question');
    }
    if (!transcript.match(/[0-9]/)) {
      opportunities.push('Reference a data point or fact');
    }
    if (transcript.split(' ').length < 40) {
      opportunities.push('Expand on your reasoning with another example');
    }
    return opportunities.length ? opportunities : ['Keep building on audience reactions'];
  }

  private buildSummary(civility: number, strengths: string[], opportunities: string[]) {
    const civilityLabel = civility > 80 ? 'excellent' : civility > 60 ? 'solid' : 'needs attention';
    return `Civility is ${civilityLabel}. Highlight: ${strengths[0]}. Next: ${opportunities[0]}.`;
  }
}
