import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  // The live server serves ./build/client, so a verification build can be
  // pointed elsewhere: BUILD_DIR=/some/scratch/dir pnpm build
  buildDirectory: process.env.BUILD_DIR ?? 'build',
} satisfies Config;
