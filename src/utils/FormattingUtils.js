/**
 * 🎨 Asset 포맷팅 유틸리티
 *
 * openapi-codegen 툴킷 패턴 기반 하이브리드 포맷팅
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

/**
 * 조건부 포맷팅 함수 - 생성된 파일들만 포맷
 * @param {string[]} generatedFiles - 포맷할 파일 경로 배열
 * @param {string} configPath - 설정 파일 경로
 */
export async function conditionalFormat(generatedFiles = [], configPath = './asset-codegen.config.json') {
	try {
		// 1. 설정에서 autoFormat 옵션 확인
		let autoFormatEnabled = true
		try {
			if (existsSync(configPath)) {
				const config = JSON.parse(readFileSync(configPath, 'utf-8'))
				autoFormatEnabled = config.formatting?.autoFormat !== false
			}
		} catch (e) {
			// 설정 파일이 없으면 기본값 true 사용
		}

		if (!autoFormatEnabled) {
			console.log('⚙️  autoFormat이 비활성화되어 포맷팅을 스킵합니다.')
			return false
		}

		// 2. package.json에서 format 스크립트 확인
		if (!hasFormatScript()) {
			console.log('⚠️  package.json에 format 스크립트가 없어 포맷팅을 스킵합니다.')
			return false
		}

		if (!generatedFiles || generatedFiles.length === 0) {
			console.log('⚠️  포맷할 생성된 파일이 없습니다.')
			return false
		}

		// 3. 생성된 파일들만 포맷팅 (더 정확함)
		try {
			console.log('🎨 생성된 파일들 포맷팅 실행 중...')
			const fileList = generatedFiles.map((file) => `"${file}"`).join(' ')
			execSync(`npx prettier --write ${fileList}`, {
				stdio: 'inherit',
				cwd: process.cwd(),
			})
			console.log('   ✅ 포맷팅 완료')
			return true
		} catch (prettierError) {
			// 4. npm run format으로 폴백 (전체 프로젝트 - 최후 수단)
			try {
				console.log('🎨 npm run format으로 폴백 실행...')
				execSync('npm run format', {
					stdio: 'inherit',
					cwd: process.cwd(),
				})
				console.log('   ✅ 포맷팅 완료')
				return true
			} catch (formatError) {
				console.warn('   ⚠️ 포맷팅 스킵:', formatError.message)
				return false
			}
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