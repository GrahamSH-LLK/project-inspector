import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { vitePreprocess } from '@sveltejs/kit/vite';

export default defineConfig({

	assetsInclude: ['**/*.ttf'],

	plugins: [sveltekit()],
	preprocess: vitePreprocess()

});
