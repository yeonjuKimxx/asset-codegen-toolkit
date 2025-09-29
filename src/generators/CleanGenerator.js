/**
 * 🧹 파일명에서 폴더명 제거 생성기
 *
 * Asset 파일명에서 중복된 폴더명을 스마트하게 제거합니다
 */

import { promises as fs } from 'fs'
import { join, dirname, basename, extname } from 'path'
import chalk from 'chalk'

export class CleanGenerator {
	constructor(config) {
		this.config = config
	}

	/**
	 * 폴더명 정리 프로세스 실행
	 */
	async generate() {
		console.log(chalk.blue('🧹 1단계: 파일명에서 폴더명 제거 시작...'))

		const enabledDirectories = this.config.assetDirectories.filter(dir => dir.enabled)

		if (enabledDirectories.length === 0) {
			console.log(chalk.yellow('⚠️ 활성화된 Asset 디렉토리가 없습니다.'))
			return []
		}

		// 1. 모든 폴더명 수집
		const allFolderNames = await this.collectAllFolderNames(enabledDirectories)
		console.log(chalk.gray(`📂 수집된 폴더명: ${Array.from(allFolderNames).join(', ')}`))

		// 2. 각 디렉토리에서 파일명 정리
		const processedFiles = []
		for (const assetDir of enabledDirectories) {
			const files = await this.cleanFilenamesInDirectory(assetDir, allFolderNames)
			processedFiles.push(...files)
		}

		console.log(chalk.green(`✅ 1단계 완료: ${processedFiles.length}개 파일 처리됨`))
		return processedFiles
	}

	/**
	 * 모든 Asset 디렉토리에서 폴더명 수집
	 */
	async collectAllFolderNames(assetDirectories) {
		const allFolderNames = new Set()

		for (const assetDir of assetDirectories) {
			// 베이스 Asset 디렉토리명 추가
			allFolderNames.add(assetDir.name)

			try {
				await this.collectFolderNamesRecursive(assetDir.path, allFolderNames)
			} catch (error) {
				console.warn(chalk.yellow(`⚠️ 디렉토리 스캔 실패: ${assetDir.path} - ${error.message}`))
			}
		}

		return allFolderNames
	}

	/**
	 * 재귀적으로 폴더명 수집
	 */
	async collectFolderNamesRecursive(dirPath, folderNames) {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					folderNames.add(entry.name)
					const subDirPath = join(dirPath, entry.name)
					await this.collectFolderNamesRecursive(subDirPath, folderNames)
				}
			}
		} catch (error) {
			// 디렉토리가 없거나 접근할 수 없는 경우 무시
		}
	}

	/**
	 * 특정 디렉토리에서 파일명 정리
	 */
	async cleanFilenamesInDirectory(assetDir, allFolderNames) {
		const processedFiles = []

		try {
			await this.processDirectoryRecursive(assetDir.path, assetDir, allFolderNames, processedFiles)
		} catch (error) {
			console.error(chalk.red(`❌ 디렉토리 처리 실패: ${assetDir.path} - ${error.message}`))
		}

		return processedFiles
	}

	/**
	 * 재귀적으로 디렉토리 처리
	 */
	async processDirectoryRecursive(dirPath, assetDir, allFolderNames, processedFiles) {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name)

				if (entry.isDirectory()) {
					await this.processDirectoryRecursive(fullPath, assetDir, allFolderNames, processedFiles)
				} else if (this.isAssetFile(entry.name)) {
					const result = await this.cleanSingleFile(fullPath, assetDir, allFolderNames)
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
	 * 단일 파일명 정리
	 */
	async cleanSingleFile(filePath, assetDir, allFolderNames) {
		const directory = dirname(filePath)
		const originalFilename = basename(filePath)
		const extension = extname(originalFilename)
		const nameWithoutExt = basename(originalFilename, extension)

		// 폴더명 제거 로직
		const cleanedName = this.removeFolderNamesFromFilename(nameWithoutExt, allFolderNames)

		if (cleanedName === nameWithoutExt) {
			// 변경사항 없음
			return null
		}

		const newFilename = cleanedName + extension
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
				newPath: newFilePath
			}
		} catch (error) {
			console.error(chalk.red(`  ✗ 파일명 변경 실패: ${originalFilename} - ${error.message}`))
			return null
		}
	}

	/**
	 * 파일명에서 폴더명들을 제거
	 */
	removeFolderNamesFromFilename(filename, folderNames) {
		let cleanedName = filename
		const separatorChar = this.config.conventions?.separatorChar || '-'

		// 정렬: 긴 것부터 처리하여 부분 매칭 방지
		const sortedFolderNames = Array.from(folderNames).sort((a, b) => b.length - a.length)

		for (const folderName of sortedFolderNames) {
			const patterns = [
				new RegExp(`^${this.escapeRegex(folderName)}${this.escapeRegex(separatorChar)}`, 'gi'),
				new RegExp(`${this.escapeRegex(separatorChar)}${this.escapeRegex(folderName)}${this.escapeRegex(separatorChar)}`, 'gi'),
				new RegExp(`${this.escapeRegex(separatorChar)}${this.escapeRegex(folderName)}$`, 'gi')
			]

			for (const pattern of patterns) {
				const beforeReplace = cleanedName
				cleanedName = cleanedName.replace(pattern, (match, offset) => {
					// 시작과 끝 패턴의 경우 구분자만 제거
					if (offset === 0) return '' // 시작 패턴
					if (offset + match.length === beforeReplace.length) return '' // 끝 패턴
					return separatorChar // 중간 패턴의 경우 구분자 하나만 남김
				})
			}
		}

		// 연속된 구분자 정리
		const separatorPattern = new RegExp(`${this.escapeRegex(separatorChar)}{2,}`, 'g')
		cleanedName = cleanedName.replace(separatorPattern, separatorChar)

		// 앞뒤 구분자 제거
		const trimPattern = new RegExp(`^${this.escapeRegex(separatorChar)}+|${this.escapeRegex(separatorChar)}+$`, 'g')
		cleanedName = cleanedName.replace(trimPattern, '')

		return cleanedName || 'unnamed'
	}

	/**
	 * 정규식 특수문자 이스케이프
	 */
	escapeRegex(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}
}