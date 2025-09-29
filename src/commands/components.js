/**
 * ⚛️ Components 명령어
 *
 * React 컴포넌트, hooks, utils를 생성하는 개별 실행 명령어
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'
import { ComponentsGenerator } from '../generators/ComponentsGenerator.js'

/**
 * Components 명령어 실행
 * @param {object} options - 명령어 옵션
 */
export async function componentsCommand(options) {
	console.log(chalk.blue.bold('⚛️ React 컴포넌트 생성 시작...\n'))

	try {
		// 1. 설정 로드
		const configManager = new ConfigManager()
		const config = configManager.loadConfig(options.config)

		console.log(chalk.gray(`📋 설정 파일: ${options.config}`))
		console.log(chalk.gray(`📂 처리 대상: ${config.assetDirectories.filter(d => d.enabled).map(d => d.name).join(', ')}`))
		console.log(chalk.gray(`📁 출력 디렉토리: ${config.fileGeneration.outputDir}`))
		console.log(chalk.gray(`🛠️ 프레임워크: ${config.componentGeneration?.framework || 'react'}`))
		console.log(chalk.gray(`📦 컴포넌트명: ${config.componentGeneration?.componentName || 'Asset'}\n`))

		// 2. Components Generator 실행
		const componentsGenerator = new ComponentsGenerator(config)
		const result = await componentsGenerator.generate()

		// 3. 결과 출력
		if (result && result.success) {
			console.log(chalk.green.bold(`\n✅ Components 생성 완료!`))

			if (result.generatedFiles && result.generatedFiles.length > 0) {
				console.log(chalk.blue(`\n📁 생성된 파일들:`))
				result.generatedFiles.forEach(file => {
					console.log(chalk.gray(`   ✓ ${file.type}: ${file.path}`))
				})
			}

			if (result.stats) {
				console.log(chalk.blue(`\n📊 생성 통계:`))
				console.log(chalk.gray(`   컴포넌트: ${result.stats.components || 0}개`))
				console.log(chalk.gray(`   Hooks: ${result.stats.hooks || 0}개`))
				console.log(chalk.gray(`   Utils: ${result.stats.utils || 0}개`))
			}

			if (config.componentGeneration?.generateHook) {
				console.log(chalk.green(`\n🪝 Hooks 사용 예제:`))
				console.log(chalk.gray(`   const asset = useAsset('icon-name')`))
				console.log(chalk.gray(`   const { src, alt } = asset`))
			}

			if (config.componentGeneration?.generateUtils) {
				console.log(chalk.green(`\n🛠️ Utils 사용 예제:`))
				console.log(chalk.gray(`   const assetPath = getAssetPath('icon-name')`))
				console.log(chalk.gray(`   const assetInfo = getAssetInfo('icon-name')`))
			}
		} else {
			console.log(chalk.yellow('⚠️ 생성할 컴포넌트가 없습니다.'))
		}

	} catch (error) {
		console.error(chalk.red.bold('\n❌ Components 생성 실패:'))
		console.error(chalk.red(`   ${error.message}`))

		if (error.stack) {
			console.error(chalk.gray('\n상세 오류:'))
			console.error(chalk.gray(error.stack))
		}

		process.exit(1)
	}
}