import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { vitePreprocess } from '@sveltejs/kit/vite';

export default defineConfig({
	optimizeDeps: {
		include: ['@turbowarp/sbdl'],
	  },
	
	plugins: [sveltekit()],
	preprocess: vitePreprocess()

});
