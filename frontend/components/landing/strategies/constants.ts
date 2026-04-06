export const MOTION_DURATION = 3.8;
export const RESET_DELAY = 0.7;
export const CYCLE_DURATION = MOTION_DURATION + RESET_DELAY;

export const FLOW_TIMES = [0, 0.55, 0.88, 1];
export const FLOW_OPACITY = [0, 1, 1, 0];
export const FLOW_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: FLOW_TIMES,
};

export const TENSION_TIMES = [0, 0.7, 0.82, 1];
export const RELEASE_TIMES = [0, 0.76, 0.86, 0.94, 1];
export const TENSION_OPACITY = [0, 1, 1, 0];
export const RELEASE_OPACITY = [0, 0, 1, 1, 0];
export const TENSION_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: TENSION_TIMES,
};
export const RELEASE_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: RELEASE_TIMES,
};

export const QE_RELEASE_TIMES = [0, 0.76, 0.96, 0.99, 1];
export const QE_RELEASE_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: QE_RELEASE_TIMES,
};

export const QE_1_TIMES = [0, 0.45, 0.9, 1];
export const QE_2_TIMES = [0, 0.45, 0.9, 0.95, 1];

export const QE_1_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: QE_1_TIMES,
};
export const QE_2_TRANSITION = {
  duration: MOTION_DURATION,
  repeat: Infinity,
  repeatDelay: RESET_DELAY,
  ease: 'linear' as const,
  times: QE_2_TIMES,
};
