/**
 * 🎨 Asset 포맷팅 유틸리티
 *
 * openapi-codegen 툴킷 패턴 기반 하이브리드 포맷팅
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

/**
 * 조건부 포맷팅 함수 - outputDir 폴더만 prettier로 자동 포맷
 * @param {string[]} generatedFiles - 생성된 파일 경로 배열
 * @param {string} configPath - 설정 파일 경로
 */
export async function conditionalFormat(generatedFiles = [], configPath = './asset-codegen.config.json') {
	try {
		// 1. 설정 로드
		let config = null
		try {
			if (existsSync(configPath)) {
				config = JSON.parse(readFileSync(configPath, 'utf-8'))
			}
		} catch (e) {
			console.warn('⚠️  설정 파일을 읽을 수 없습니다.')
			return false
		}

		if (!config) {
			return false
		}

		// 2. autoFormat 옵션 확인
		const autoFormatEnabled = config.formatting?.autoFormat !== false
		if (!autoFormatEnabled) {
			console.log('⚙️  autoFormat이 비활성화되어 포맷팅을 스킵합니다.')
			return false
		}

		if (!generatedFiles || generatedFiles.length === 0) {
			console.log('⚠️  포맷할 생성된 파일이 없습니다.')
			return false
		}

		// 3. outputDir 추출
		const outputDir = config.fileGeneration?.outputDir
		if (!outputDir) {
			console.warn('⚠️  outputDir이 설정되지 않았습니다.')
			return false
		}

		// 4. outputDir 폴더만 prettier로 포맷팅
		try {
			console.log(`🎨 ${outputDir} 폴더 포맷팅 실행 중...`)
			execSync(`npx prettier --write "${outputDir}/**/*"`, {
				stdio: 'pipe',
				cwd: process.cwd(),
			})
			console.log('   ✅ 포맷팅 완료')
			return true
		} catch (error) {
			// prettier가 없거나 실패해도 조용히 스킵
			console.log('   ⚠️ 포맷팅 스킵 (prettier 없음 또는 실패)')
			return false
		}
	} catch (error) {
		console.warn('   ⚠️ 포맷팅 스킵:', error.message)
		return false
	}
}

/**
 * package.json에서 format 스크립트 존재 여부 확인
 */
function hasFormatScript() {
	try {
		const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
		return !!(
			packageJson.scripts &&
			(packageJson.scripts.format || packageJson.scripts['format:write'] || packageJson.scripts.prettier)
		)
	} catch {
		return false
	}
}

/**
 * 명령어에 조건부 포맷팅 추가
 * @param {string} command - 기본 명령어
 * @param {string[]} generatedFiles - 생성된 파일 경로들
 * @returns {string} 포맷팅이 포함된 명령어
 */
export function addConditionalFormatting(command, generatedFiles = []) {
	if (!hasFormatScript()) {
		return command
	}

	// 생성된 파일들이 있으면 해당 파일들만 포맷
	if (generatedFiles.length > 0) {
		const fileList = generatedFiles.map((file) => `"${file}"`).join(' ')
		return `${command} && npx prettier --write ${fileList} 2>/dev/null || npm run format 2>/dev/null || true`
	}

	// 기본적으로 npm run format 사용
	return `${command} && npm run format`
}

/**
 * 여러 파일 경로를 하나의 배열로 합치는 유틸리티
 * @param {...string[]} fileLists - 파일 경로 배열들
 * @returns {string[]} 중복 제거된 파일 경로 배열
 */
export function mergeGeneratedFiles(...fileLists) {
	const allFiles = fileLists.flat().filter(Boolean)
	return [...new Set(allFiles)] // 중복 제거
}