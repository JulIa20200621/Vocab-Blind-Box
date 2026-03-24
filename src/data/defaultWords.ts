import { WordBank } from './types';

export const DEFAULT_BANKS: WordBank[] = [
  {
    id: 'gaokao',
    name: '高考词汇',
    words: [
      { word: 'abandon', pos: 'v.', meaning: '放弃，遗弃' },
      { word: 'ability', pos: 'n.', meaning: '能力，才干' },
      { word: 'abnormal', pos: 'adj.', meaning: '反常的，变态的' },
      { word: 'absence', pos: 'n.', meaning: '缺席，不在场' },
      { word: 'absolute', pos: 'adj.', meaning: '绝对的，完全的' },
      { word: 'absorb', pos: 'v.', meaning: '吸收，吸引' },
      { word: 'abstract', pos: 'adj.', meaning: '抽象的，深奥的' },
      { word: 'academic', pos: 'adj.', meaning: '学院的，学术的' },
      { word: 'accent', pos: 'n.', meaning: '口音，腔调' },
      { word: 'accept', pos: 'v.', meaning: '接受，认可' },
    ]
  },
  {
    id: 'cet4',
    name: '四级词汇',
    words: [
      { word: 'accelerate', pos: 'v.', meaning: '加速，促进' },
      { word: 'accomplish', pos: 'v.', meaning: '完成，实现' },
      { word: 'accumulate', pos: 'v.', meaning: '积累，堆积' },
      { word: 'accurate', pos: 'adj.', meaning: '准确的，精确的' },
      { word: 'adequate', pos: 'adj.', meaning: '充足的，适当的' },
      { word: 'advocate', pos: 'v.', meaning: '提倡，鼓吹' },
      { word: 'ambiguous', pos: 'adj.', meaning: '模棱两可的' },
      { word: 'anticipate', pos: 'v.', meaning: '预期，期望' },
      { word: 'appropriate', pos: 'adj.', meaning: '适当的，恰当的' },
      { word: 'artificial', pos: 'adj.', meaning: '人造的，虚伪的' },
    ]
  },
  {
    id: 'cet6',
    name: '六级词汇',
    words: [
      { word: 'alleviate', pos: 'v.', meaning: '减轻，缓和' },
      { word: 'ambivalent', pos: 'adj.', meaning: '矛盾的' },
      { word: 'benevolent', pos: 'adj.', meaning: '慈善的，仁慈的' },
      { word: 'comprehensive', pos: 'adj.', meaning: '全面的，综合的' },
      { word: 'deteriorate', pos: 'v.', meaning: '恶化，变坏' },
      { word: 'eloquent', pos: 'adj.', meaning: '雄辩的，有口才的' },
      { word: 'formidable', pos: 'adj.', meaning: '可怕的，难对付的' },
      { word: 'hypothetical', pos: 'adj.', meaning: '假设的，假定的' },
      { word: 'inevitable', pos: 'adj.', meaning: '不可避免的' },
      { word: 'meticulous', pos: 'adj.', meaning: '一丝不苟的' },
    ]
  }
];
