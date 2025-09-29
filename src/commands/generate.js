/**
 * 🚀 메인 생성 명령어
 *
 * Asset CodeGen 전체 프로세스를 실행합니다
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'
import { AssetGenerator } from '../generators/AssetGenerator.js'

/**
 * generate 명령어 핸들러
 * @param {object} options - 명령어 옵션
 */
export async function generateCommand(options) {
	try {
		console.log(chalk.green('🚀 Asset 코드 생성 시작...'))

		const generator = new AssetGenerator({
			configPath: options.config,
			steps: parseSteps(options),
			dryRun: options.dryRun || false,
		})

		const result = await generator.generate()

		if (result.success) {
			console.log(chalk.green('✅ Asset 코드 생성 완료!'))
			console.log(chalk.blue(`📁 생성된 파일: ${result.generatedFiles.length}개`))

			if (options.dryRun) {
				console.log(chalk.yellow('\n🔍 시뮬레이션 모드 - 실제 파일은 생성되지 않았습니다'))
			}

			// 사용법 안내
			console.log(chalk.blue('\n🔧 사용법:'))
			console.log('  import { Asset, useAssetPath, getAssetPath } from \'./src/components/asset\'')
			console.log('  <Asset type="icon" name="your-asset-name" size="md" />')

		} else {
			console.error(chalk.red('❌ Asset 코드 생성 실패'))
			if (result.error) {
				console.error(chalk.red(result.error))
			}
			process.exit(1)
		}
	} catch (error) {
		console.error(chalk.red('❌ 생성 중 오류:'), error.message)
		process.exit(1)
	}
}

/**
 * 실행할 단계 파싱
 * @param {object} options - 명령어 옵션
 * @returns {string[]} 실행할 단계 목록
 */
function parseSteps(options) {
	// --steps 옵션 처리
	if (options.steps) {
		return options.steps.split(',').map((s) => s.trim())
	}

	// 기본값: 모든 단계
	return []
}