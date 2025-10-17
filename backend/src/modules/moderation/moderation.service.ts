import { Injectable } from '@nestjs/common';

import { ModerateTextDto } from './dto/moderate-text.dto';

const TOXIC_TERMS = ['hate', 'kill', 'stupid', 'idiot', 'trash'];
const HATE_TERMS = ['racist', 'bigot', 'nazi'];
const SELF_HARM_TERMS = ['suicide', 'kill myself', 'self harm'];

@Injectable()
export class ModerationService {
  async moderateText(dto: ModerateTextDto) {
    const normalized = dto.text.toLowerCase();

    const toxicityScore = this.scoreForTerms(normalized, TOXIC_TERMS, 0.35);
    const hateScore = this.scoreForTerms(normalized, HATE_TERMS, 0.5);
    const selfHarmScore = this.scoreForTerms(normalized, SELF_HARM_TERMS, 0.6);

    const block = hateScore >= 0.6 || selfHarmScore >= 0.6;
    const flag = toxicityScore >= 0.5 || hateScore >= 0.4;

    return {
      allow: !block,
      flag,
      labels: {
        toxicity: Number(toxicityScore.toFixed(2)),
        hate: Number(hateScore.toFixed(2)),
        selfHarm: Number(selfHarmScore.toFixed(2))
      }
    };
  }

  private scoreForTerms(text: string, terms: string[], base: number) {
    const hits = terms.filter((term) => text.includes(term)).length;
    if (!hits) {
      return 0;
    }
    return Math.min(1, base + hits * 0.15);
  }
}
