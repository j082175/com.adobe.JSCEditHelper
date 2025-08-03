/**
 * Adobe ExtendScript Type Definitions
 * Premiere Pro ExtendScript 객체 및 메서드 정의
 */

// Premiere Pro Application 객체
declare namespace app {
  const project: Project;
  
  // 프로젝트 관련
  function openDocument(path: string): boolean;
  function quit(): void;
  
  // 시퀀스 관련
  const activeSequence: Sequence | null;
  
  // 인코딩 및 익스포트
  const encoder: any;
}

// 프로젝트 인터페이스
interface Project {
  sequences: Sequence[];
  rootItem: ProjectItem;
  name: string;
  path: string;
  
  // 메서드
  save(): boolean;
  saveAs(path: string): boolean;
  importFiles(paths: string[]): ProjectItem[];
  createBin(name: string): ProjectItem;
}

// 시퀀스 인터페이스
interface Sequence {
  name: string;
  sequenceSettings: SequenceSettings;
  audioTracks: AudioTrack[];
  videoTracks: VideoTrack[];
  
  // 시간 관련
  end: Time;
  
  // 메서드
  clone(): Sequence;
  autoReframeSequence(outputAspectRatio: number): void;
  
  // 클립 관련
  insertClip(projectItem: ProjectItem, time: Time, videoTrackIndex?: number, audioTrackIndex?: number): TrackItem;
  getSelection(): TrackItem[];
}

// 시퀀스 설정
interface SequenceSettings {
  frameRate: number;
  audioSampleRate: number;
  audioChannelType: number;
}

// 트랙 인터페이스
interface Track {
  name: string;
  clips: TrackItem[];
  isTargeted: boolean;
  isMuted: boolean;
  
  // 메서드
  insertClip(projectItem: ProjectItem, time: Time): TrackItem;
  overwriteClip(projectItem: ProjectItem, time: Time): TrackItem;
}

interface AudioTrack extends Track {
  // 오디오 트랙 특화 속성
}

interface VideoTrack extends Track {
  // 비디오 트랙 특화 속성
}

// 트랙 아이템 (클립)
interface TrackItem {
  name: string;
  start: Time;
  end: Time;
  duration: Time;
  inPoint: Time;
  outPoint: Time;
  projectItem: ProjectItem;
  
  // 메서드
  move(time: Time): boolean;
  remove(): boolean;
  setSelected(selected: boolean): void;
  
  // 오디오 관련
  components: Component[];
}

// 프로젝트 아이템
interface ProjectItem {
  name: string;
  type: number;
  filePath: string;
  duration: Time;
  
  // 미디어 정보
  hasAudio: boolean;
  hasVideo: boolean;
  
  // 메서드
  createSubClip(name: string, startTime: Time, endTime: Time): ProjectItem;
  changeMediaPath(newPath: string): boolean;
  
  // 폴더 관련
  children: ProjectItem[];
  createBin(name: string): ProjectItem;
  moveBin(parentBin: ProjectItem): boolean;
}

// 컴포넌트 (이펙트, 오디오 레벨 등)
interface Component {
  displayName: string;
  properties: Property[];
  
  // 메서드
  remove(): boolean;
}

// 속성
interface Property {
  displayName: string;
  
  // 값 설정/가져오기
  getValue(time?: Time): any;
  setValue(value: any, time?: Time): boolean;
  
  // 키프레임
  addKey(time: Time): boolean;
  removeKey(time: Time): boolean;
  isTimeVarying(): boolean;
}

// 시간 객체
interface Time {
  seconds: number;
  ticks: number;
  
  // 생성자 함수들은 별도로 정의
}

// 시간 생성 함수들
declare var Time: {
  new(): Time;
  (): Time;
};

// 파일 시스템 관련
declare class File {
  constructor(path: string);
  
  fullName: string;
  name: string;
  path: string;
  exists: boolean;
  
  // 메서드
  open(mode: string): boolean;
  close(): boolean;
  read(): string;
  write(text: string): boolean;
  execute(): boolean;
  
  // 정적 메서드
  static openDialog(prompt?: string, filter?: string): File | null;
  static saveDialog(prompt?: string, filter?: string): File | null;
}

declare class Folder {
  constructor(path: string);
  
  fullName: string;
  name: string;
  path: string;
  exists: boolean;
  
  // 메서드
  create(): boolean;
  getFiles(mask?: string): (File | Folder)[];
  
  // 정적 메서드
  static selectDialog(prompt?: string): Folder | null;
  static current: Folder;
  static userData: Folder;
  static temp: Folder;
}

// 전역 함수들
declare function alert(message: string): void;
declare function confirm(message: string): boolean;
declare function prompt(message: string, defaultValue?: string): string | null;

// 유틸리티 함수들
declare function parseInt(value: string | number, radix?: number): number;
declare function parseFloat(value: string | number): number;
declare function isNaN(value: any): boolean;
declare function isFinite(value: any): boolean;

// ExtendScript 전용 - 네임스페이스로 정의

// 객체 확장
declare namespace $ {
  function writeln(message: string): void;
  function sleep(milliseconds: number): void;
  const global: any;
  const stack: string;
  const error: Error;
  
  // 버전 정보
  const version: string;
  const build: string;
  const buildDate: Date;
}

export {};