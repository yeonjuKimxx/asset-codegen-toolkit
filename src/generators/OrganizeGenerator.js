/**
 * 📂 파일명 체계적 재구성 생성기
 *
 * 폴더 구조를 기반으로 체계적인 파일명을 적용합니다
 */

import { promises as fs } from 'fs'
import { join, dirname, basename, extname, relative } from 'path'
import chalk from 'chalk'

export class OrganizeGenerator {
	constructor(config) {
		this.config = config
	}

	/**
	 * 파일명 재구성 프로세스 실행
	 */
	async generate() {
		console.log(chalk.blue('📂 2단계: 파일명 체계적 재구성 시작...'))

		const enabledDirectories = this.config.assetDirectories.filter(dir => dir.enabled)

		if (enabledDirectories.length === 0) {
			console.log(chalk.yellow('⚠️ 활성화된 Asset 디렉토리가 없습니다.'))
			return []
		}

		const processedFiles = []
		for (const assetDir of enabledDirectories) {
			const files = await this.organizeFilenamesInDirectory(assetDir)
			processedFiles.push(...files)
		}

		console.log(chalk.green(`✅ 2단계 완료: ${processedFiles.length}개 파일 재구성됨`))
		return processedFiles
	}

	/**
	 * 특정 디렉토리에서 파일명 재구성
	 */
	async organizeFilenamesInDirectory(assetDir) {
		const processedFiles = []

		try {
			await this.processDirectoryRecursive(assetDir.path, assetDir, processedFiles)
		} catch (error) {
			console.error(chalk.red(`❌ 디렉토리 처리 실패: ${assetDir.path} - ${error.message}`))
		}

		return processedFiles
	}

	/**
	 * 재귀적으로 디렉토리 처리
	 */
	async processDirectoryRecursive(dirPath, assetDir, processedFiles) {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name)

				if (entry.isDirectory()) {
					await this.processDirectoryRecursive(fullPath, assetDir, processedFiles)
				} else if (this.isAssetFile(entry.name)) {
					const result = await this.organizeSingleFile(fullPath, assetDir)
					if (result) {
						processedFiles.push(result)
					}
				}
			}
		} catch (error) {
			console.warn(chalk.yellow(`⚠️ 디렉토리 읽기 실패: ${dirPath} - ${error.message}`))
		}
	}

	/**
	 * Asset 파일인지 확인
	 */
	isAssetFile(filename) {
		const ext = extname(filename).toLowerCase().slice(1)
		return this.config.fileGeneration.supportedExtensions.includes(ext)
	}

	/**
	 * 단일 파일명 재구성
	 */
	async organizeSingleFile(filePath, assetDir) {
		const directory = dirname(filePath)
		const originalFilename = basename(filePath)
		const extension = extname(originalFilename)
		const nameWithoutExt = basename(originalFilename, extension)

		// 상대 경로 계산
		const relativePath = relative(assetDir.path, directory)
		const pathParts = relativePath === '.' ? [] : relativePath.split('/').filter(part => part)

		// 새로운 파일명 생성
		const newNameWithoutExt = this.addFolderStructureToFilename(
			nameWithoutExt,
			pathParts,
			assetDir.name,
			this.config.conventions?.separatorChar || '-'
		)

		if (newNameWithoutExt === nameWithoutExt) {
			// 변경사항 없음
			return null
		}

		const newFilename = newNameWithoutExt + extension
		const newFilePath = join(directory, newFilename)

		try {
			await fs.rename(filePath, newFilePath)
			console.log(chalk.green(`  ✓ ${originalFilename} → ${newFilename}`))

			return {
				assetDir: assetDir.name,
				directory,
				originalName: originalFilename,
				newName: newFilename,
				oldPath: filePath,
				newPath: newFilePath,
				pathParts,
				baseAssetName: assetDir.name
			}
		} catch (error) {
			console.error(chalk.red(`  ✗ 파일명 변경 실패: ${originalFilename} - ${error.message}`))
			return null
		}
	}

	/**
	 * 폴더 구조를 파일명에 추가
	 * 형식: baseAssetName-pathPart1-pathPart2-filename
	 */
	addFolderStructureToFilename(filename, pathParts, baseAssetName = '', separatorChar = '-') {
		const parts = []

		// 1. 베이스 Asset 이름 (최우선)
		if (baseAssetName) {
			parts.push(baseAssetName)
		}

		// 2. 경로 부분들 (순서대로)
		if (pathParts.length > 0) {
			parts.push(...pathParts)
		}

		// 3. 파일명 (마지막)
		parts.push(filename)

		return parts.join(separatorChar)
	}

	/**
	 * 파일명이 이미 적절한 형태인지 확인
	 */
	isAlreadyOrganized(filename, pathParts, baseAssetName, separatorChar = '-') {
		const expectedPattern = this.addFolderStructureToFilename('', pathParts, baseAssetName, separatorChar)
		return filename.startsWith(expectedPattern)
	}

	/**
	 * 중복 경로 부분 제거
	 */
	removeDuplicatePathParts(filename, pathParts, separatorChar = '-') {
		let cleanedFilename = filename

		for (const part of pathParts) {
			const pattern = new RegExp(`(^|${this.escapeRegex(separatorChar)})${this.escapeRegex(part)}(?=${this.escapeRegex(separatorChar)}|$)`, 'gi')
			cleanedFilename = cleanedFilename.replace(pattern, '$1')
		}

		// 연속된 구분자 정리
		const separatorPattern = new RegExp(`${this.escapeRegex(separatorChar)}{2,}`, 'g')
		cleanedFilename = cleanedFilename.replace(separatorPattern, separatorChar)

		// 앞뒤 구분자 제거
		const trimPattern = new RegExp(`^${this.escapeRegex(separatorChar)}+|${this.escapeRegex(separatorChar)}+$`, 'g')
		cleanedFilename = cleanedFilename.replace(trimPattern, '')

		return cleanedFilename
	}

	/**
	 * 정규식 특수문자 이스케이프
	 */
	escapeRegex(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

	/**
	 * 네이밍 컨벤션 적용
	 */
	applyNamingConvention(text) {
		const caseStyle = this.config.conventions?.caseStyle || 'kebab-case'

		switch (caseStyle) {
			case 'kebab-case':
				return this.toKebabCase(text)
			case 'camelCase':
				return this.toCamelCase(text)
			case 'snake_case':
				return this.toSnakeCase(text)
			case 'PascalCase':
				return this.toPascalCase(text)
			default:
				return text
		}
	}

	/**
	 * kebab-case 변환
	 */
	toKebabCase(text) {
		return text
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/[\s_]+/g, '-')
			.toLowerCase()
	}

	/**
	 * camelCase 변환
	 */
	toCamelCase(text) {
		return text
			.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
			.replace(/^[A-Z]/, char => char.toLowerCase())
	}

	/**
	 * snake_case 변환
	 */
	toSnakeCase(text) {
		return text
			.replace(/([a-z])([A-Z])/g, '$1_$2')
			.replace(/[-\s]+/g, '_')
			.toLowerCase()
	}

	/**
	 * PascalCase 변환
	 */
	toPascalCase(text) {
		return text
			.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
			.replace(/^[a-z]/, char => char.toUpperCase())
	}
}