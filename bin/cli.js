#!/usr/bin/env node

/**
 * 🚀 Asset CodeGen CLI
 *
 * Asset 파일 자동 관리 및 TypeScript/React 코드 생성 도구
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

// ES modules에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 패키지 정보 로드
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))

const program = new Command()

// CLI 설정
program
	.name('asset-codegen')
	.description('Asset 파일 자동 관리 및 TypeScript/React 코드 생성 도구')
	.version(packageJson.version)
	.addHelpText(
		'before',
		chalk.blue.bold(`
🎨 Asset CodeGen v${packageJson.version}
Asset 파일을 자동으로 관리하고 TypeScript/React 코드를 생성하는 도구
`)
	)

// init 명령어
program
	.command('init')
	.description('새 프로젝트 초기화 (설정 파일 및 템플릿 생성)')
	.option('-t, --type <type>', '프로젝트 타입 (nextjs, react, react-native)', 'nextjs')
	.option('-f, --force', '기존 파일 덮어쓰기')
	.option('-o, --output <path>', '설정 파일 출력 경로', './asset-codegen.config.json')
	.action(async (options) => {
		console.log(chalk.green('🚀 Asset CodeGen 프로젝트 초기화...'))
		try {
			const { initCommand } = await import('../src/commands/init.js')
			await initCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 초기화 실패:'), error.message)
			process.exit(1)
		}
	})

// generate 명령어 (전체 프로세스)
program
	.command('generate')
	.alias('gen')
	.description('Asset 코드 생성 (전체 프로세스)')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.option('-s, --steps <steps>', '실행할 단계 (쉼표로 구분)', '')
	.option('--dry-run', '실제 파일 생성 없이 시뮬레이션만 실행')
	.action(async (options) => {
		try {
			const { generateCommand } = await import('../src/commands/generate.js')
			await generateCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 생성 실패:'), error.message)
			process.exit(1)
		}
	})

// 개별 단계 명령어들
program
	.command('clean')
	.description('폴더명 제거 (1단계)')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.action(async (options) => {
		try {
			const { cleanCommand } = await import('../src/commands/clean.js')
			await cleanCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 폴더명 제거 실패:'), error.message)
			process.exit(1)
		}
	})

program
	.command('organize')
	.description('새 폴더 구조 네이밍 (2단계)')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.action(async (options) => {
		try {
			const { organizeCommand } = await import('../src/commands/organize.js')
			await organizeCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 네이밍 실패:'), error.message)
			process.exit(1)
		}
	})

program
	.command('types')
	.description('TypeScript 타입 생성 (3단계)')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.action(async (options) => {
		try {
			const { typesCommand } = await import('../src/commands/types.js')
			await typesCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 타입 생성 실패:'), error.message)
			process.exit(1)
		}
	})

program
	.command('components')
	.description('React 컴포넌트 생성 (4단계)')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.action(async (options) => {
		try {
			const { componentsCommand } = await import('../src/commands/components.js')
			await componentsCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 컴포넌트 생성 실패:'), error.message)
			process.exit(1)
		}
	})

// validate-config 명령어
program
	.command('validate-config')
	.alias('validate')
	.description('설정 파일 검증')
	.option('-c, --config <path>', '설정 파일 경로', './asset-codegen.config.json')
	.action(async (options) => {
		try {
			const { validateCommand } = await import('../src/commands/validate.js')
			await validateCommand(options)
		} catch (error) {
			console.error(chalk.red('❌ 검증 실패:'), error.message)
			process.exit(1)
		}
	})

// examples 명령어
program
	.command('examples')
	.description('사용 예제 출력')
	.action(() => {
		console.log(chalk.green.bold('\n📚 사용 예제:\n'))

		console.log(chalk.yellow('1. 새 프로젝트 초기화:'))
		console.log('   npx @stepin/asset-codegen init --type=nextjs')

		console.log(chalk.yellow('\n2. Asset 코드 전체 생성:'))
		console.log('   npx @stepin/asset-codegen generate')

		console.log(chalk.yellow('\n3. 특정 단계만 실행:'))
		console.log('   npx @stepin/asset-codegen clean       # 폴더명 제거만')
		console.log('   npx @stepin/asset-codegen organize    # 새 네이밍만')
		console.log('   npx @stepin/asset-codegen types       # 타입 생성만')
		console.log('   npx @stepin/asset-codegen components  # 컴포넌트 생성만')

		console.log(chalk.yellow('\n4. 설정 파일 검증:'))
		console.log('   npx @stepin/asset-codegen validate-config')

		console.log(chalk.yellow('\n5. 시뮬레이션 모드:'))
		console.log('   npx @stepin/asset-codegen generate --dry-run')

		console.log(chalk.blue('\n💡 자세한 설정은 asset-codegen.config.json 파일을 참조하세요.'))
	})

// info 명령어
program
	.command('info')
	.description('패키지 정보 출력')
	.action(() => {
		console.log(chalk.blue.bold('\n📦 패키지 정보:'))
		console.log(`   이름: ${packageJson.name}`)
		console.log(`   버전: ${packageJson.version}`)
		console.log(`   설명: ${packageJson.description}`)
		console.log(`   작성자: ${packageJson.author}`)
		console.log(`   라이선스: ${packageJson.license}`)
		console.log(`   홈페이지: ${packageJson.homepage}`)

		console.log(chalk.green.bold('\n🛠️ 지원하는 기능:'))
		console.log('   ✅ Asset 파일명 자동 정리')
		console.log('   ✅ 폴더 구조 기반 네이밍')
		console.log('   ✅ TypeScript 타입 생성')
		console.log('   ✅ React 컴포넌트 생성')
		console.log('   ✅ React Hooks 생성')
		console.log('   ✅ 유틸리티 함수 생성')
		console.log('   ✅ 하이브리드 포맷팅')
		console.log('   ✅ 설정 기반 커스터마이징')

		console.log(chalk.magenta.bold('\n🎯 지원하는 프로젝트:'))
		console.log('   • Next.js (App Router, Pages Router)')
		console.log('   • React (CRA, Vite)')
		console.log('   • React Native')
		console.log('   • 기타 TypeScript 프로젝트')
	})

// 글로벌 에러 핸들러
process.on('uncaughtException', (error) => {
	console.error(chalk.red.bold('\n❌ 예상치 못한 오류가 발생했습니다:'))
	console.error(chalk.red(error.message))
	console.error(chalk.gray('상세 정보:'), error.stack)
	process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
	console.error(chalk.red.bold('\n❌ 처리되지 않은 Promise 거부:'))
	console.error(chalk.red(reason))
	process.exit(1)
})

// 명령어 파싱 및 실행
program.parse()

// 명령어가 없으면 도움말 출력
if (!process.argv.slice(2).length) {
	program.outputHelp()
}