/**
 * 🔍 설정 검증 명령어
 */

import chalk from 'chalk'
import { ConfigManager } from '../utils/ConfigManager.js'

export async function validateCommand(options) {
	const { config: configPath = './asset-codegen.config.json' } = options

	console.log(chalk.blue('🔍 설정 파일 검증 중...'))

	const configManager = new ConfigManager()
	const validation = configManager.validateConfig(configPath)

	if (validation.isValid) {
		console.log(chalk.green('✅ 설정 파일이 유효합니다!'))
		console.log(chalk.blue(`📁 프로젝트: ${validation.config.projectName}`))
		console.log(chalk.blue(`📂 Asset 디렉토리: ${validation.config.assetDirectories.length}개`))
	} else {
		console.log(chalk.red('❌ 설정 파일에 오류가 있습니다:'))
		validation.errors.forEach(error => {
			console.log(chalk.red(`   • ${error}`))
		})
		process.exit(1)
	}
}