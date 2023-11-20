## [0.28.1](https://github.com/egose/egose/compare/v0.28.0...v0.28.1) (2023-11-20)


### Features

* **moo:** set mongoose as the this object of the plugin func ([35689cc](https://github.com/egose/egose/commit/35689ccb20f30075fc049e5a675946e943ac35f3))


### Docs

* **moo:** remove unnecessary dep ([99741ab](https://github.com/egose/egose/commit/99741ab7182a177a864dec9a2ba7676eff59633b))

## [0.28.0](https://github.com/egose/egose/compare/v0.27.2...v0.28.0) (2023-11-19)


### Features

* **moo:** add uniqueNullableString schema helper ([e5c724e](https://github.com/egose/egose/commit/e5c724e6ca08e1604451ef7dc401686faa17cb5d))
* **moo:** support 'byId' static method in plugin ([9054d03](https://github.com/egose/egose/commit/9054d03080bb7138cf47cb0a45f68e541cb67980))

## [0.27.2](https://github.com/egose/egose/compare/v0.27.1...v0.27.2) (2023-11-15)


### Features

* **adapter-js:** include total count as data by default ([050b34f](https://github.com/egose/egose/commit/050b34f59eea50881302e1350008c8c08b953dde))

## [0.27.1](https://github.com/egose/egose/compare/v0.27.0...v0.27.1) (2023-11-15)

## [0.27.0](https://github.com/egose/egose/compare/v0.26.0...v0.27.0) (2023-11-15)


### Features

* **acl:** add sub bulk update endpoint ([433ca1b](https://github.com/egose/egose/commit/433ca1b7e0994954acdbb8d74b62b34cd6752320))
* **adapter-js:** add sub bulk update service ([6a2bd05](https://github.com/egose/egose/commit/6a2bd0503e7feeb72d974e38a3e75bad0898ba4d))
* **adapter-js:** add wrap axios endpoints in multiple scopes ([29845a4](https://github.com/egose/egose/commit/29845a4f81da19b6fb5b6ff78de58c2487a4879b))

## [0.26.0](https://github.com/egose/egose/compare/v0.25.0...v0.26.0) (2023-11-13)


### Refactors

* **acl:** clean up sub service logic ([cf8f45f](https://github.com/egose/egose/commit/cf8f45fcc5beb654b391c78a2d1792d917a509e0))
* **acl:** move common router options to dep level ([a97a690](https://github.com/egose/egose/commit/a97a6906906a74955a6e4ecc7da2778db76e606d))
* **acl:** use sift for better mongodb-like filter support ([3ba2e86](https://github.com/egose/egose/commit/3ba2e8647b247bfbbb6e7b5624a1fe9197e0b77c))

## [0.25.0](https://github.com/egose/egose/compare/v0.24.0...v0.25.0) (2023-11-13)


### Features

* **adapter-js:** add data router ([68e0299](https://github.com/egose/egose/commit/68e029944f9740d90b27fe3b72c4e645cc398c88))

## [0.24.0](https://github.com/egose/egose/compare/v0.23.0...v0.24.0) (2023-11-07)


### Features

* **acl:** rename process to tasks ([916b529](https://github.com/egose/egose/commit/916b529f23c1307c676e838a5291cd5194159015))

## [0.23.0](https://github.com/egose/egose/compare/v0.22.2...v0.23.0) (2023-11-06)


### Features

* **adapter-js:** add utils ([fcb3d1a](https://github.com/egose/egose/commit/fcb3d1adb7d58ac47bcd474f6a0fda904daad1c6))
* **adapter-js:** support response callbacks ([1d2bfdb](https://github.com/egose/egose/commit/1d2bfdb1b95aa1af461acda5e0d358029ba4a84d))

## [0.22.2](https://github.com/egose/egose/compare/v0.22.1...v0.22.2) (2023-11-05)

## [0.22.1](https://github.com/egose/egose/compare/v0.22.0...v0.22.1) (2023-11-04)


### Bug Fixes

* **acl:** include permissions if requested in list ([f7fa7eb](https://github.com/egose/egose/commit/f7fa7eb13bc28bc6fc34de40e0d32b50f33cd472))

## [0.22.0](https://github.com/egose/egose/compare/v0.21.2...v0.22.0) (2023-11-04)


### Features

* **adapter-js:** support sub documents routes & services ([03075ab](https://github.com/egose/egose/commit/03075ab8ea6086abfe65615396b400fb936e412f))


### Refactors

* **acl:** organize sub document routes & services ([e57d302](https://github.com/egose/egose/commit/e57d302a69868a69c447957539bc6811d9ef5388))

## [0.21.2](https://github.com/egose/egose/compare/v0.21.0...v0.21.2) (2023-11-03)


### Docs

* add CHANGELOG.md ([888a1b3](https://github.com/egose/egose/commit/888a1b36f7cceb26dfa09ca052f71da98b4c016c))

## [0.21.0](https://github.com/egose/egose/compare/v0.20.1...v0.21.0) (2023-11-02)


### Features

* **acl:** add include argument & logic ([97d9345](https://github.com/egose/egose/commit/97d9345d9fb81f4c2f073ae1df46db1adbabc457))
* **adapter-js:** add include argument & logic ([f0fc382](https://github.com/egose/egose/commit/f0fc3829084500bfc253c9d0122b1ab783a55928))

## [0.20.1](https://github.com/egose/egose/compare/v0.20.0...v0.20.1) (2023-10-31)

## [0.20.0](https://github.com/egose/egose/compare/v0.19.1...v0.20.0) (2023-10-31)


### Features

* **acl:** add modelPermissionPrefix option ([963c421](https://github.com/egose/egose/commit/963c42149eaa465cc8356e31779bed45d3e9bdb7))
* **adapter-js:** add read advanced filter endpoint ([5663e19](https://github.com/egose/egose/commit/5663e19de9c057bda823acda754bd2b95379bb1c))
* **adapter-js:** support subquery with model func ([c3f9025](https://github.com/egose/egose/commit/c3f9025c3fad76a9e77a51961d69e92b7e2e7829))

## [0.19.1](https://github.com/egose/egose/compare/v0.19.0...v0.19.1) (2023-09-20)

## [0.19.0](https://github.com/egose/egose/compare/v0.18.2...v0.19.0) (2023-09-20)


### Features

* **acl:** cache base filter results ([445b909](https://github.com/egose/egose/commit/445b909ee5e9f71f031d9323633c23759123c4e5))


### Refactors

* **acl:** rename controller to service ([276da76](https://github.com/egose/egose/commit/276da76c40a3491fc2858abfddc9a64d1fe40e5b))
* transform core functions into a class ([0039f0e](https://github.com/egose/egose/commit/0039f0e2adf5cc3e2d8630de3e16e18b9c537862))

## [0.18.2](https://github.com/egose/egose/compare/v0.18.1...v0.18.2) (2023-09-14)


### Features

* **acl:** add auto field permissions ([036daae](https://github.com/egose/egose/commit/036daaeba599048056180b7adbd57f97713ba626))
* **acl:** add read filter controller ([890124a](https://github.com/egose/egose/commit/890124abc4c593c35ab85c6e288c3b26b4362df2))
* **acl:** pick allowed fields in inner controller ([25dced2](https://github.com/egose/egose/commit/25dced2fff0949e63966aa11c2144b0a4b9d5886))
* **acl:** support skim permission option ([d65e811](https://github.com/egose/egose/commit/d65e8112e64d6136d0acc68950cf59790c03e0cd))
* **adapter-js:** add defaults option in model service ([0b49fd1](https://github.com/egose/egose/commit/0b49fd1c5c53c6e56be29952dcd6f6238cfa77d5))

## [0.17.2](https://github.com/egose/egose/compare/v0.17.0...v0.17.2) (2023-07-25)


### Features

* **react-pagination-hook:** add react-pagination-hook package ([209e552](https://github.com/egose/egose/commit/209e552d24f49706302261dfcecb5fc09cc7228c))

## [0.15.1](https://github.com/egose/egose/compare/v0.15.0...v0.15.1) (2023-05-06)


### Features

* **adapter-js:** add js adapter package ([7ff0633](https://github.com/egose/egose/commit/7ff06331a24c7dcb14ae09a878e294adf779dd1a))
* **adapter-js:** support root router ([af10a20](https://github.com/egose/egose/commit/af10a2049fd3d589b8ffe9fac6940a880d270d54))

## [0.14.1](https://github.com/egose/egose/compare/v0.14.0...v0.14.1) (2023-04-27)


### ⚠ BREAKING CHANGES

* **acl:** update context definition in update operation

* **acl:** update context definition in update operation ([931c28c](https://github.com/egose/egose/commit/931c28cba81b90091f63f0cd0fdc5cb4bc93714b))


### Features

* **deco:** support model router options ([bf83c11](https://github.com/egose/egose/commit/bf83c115e3b3724ba743159a9451e16e26ffa24c))

## [0.13.5](https://github.com/egose/egose/compare/v0.13.4...v0.13.5) (2023-04-24)

## [0.13.3](https://github.com/egose/egose/compare/v0.13.2...v0.13.3) (2023-04-24)

## [0.13.2](https://github.com/egose/egose/compare/v0.13.1...v0.13.2) (2023-04-23)


### Bug Fixes

* **acl:** resolve promise to operate query ([8a88103](https://github.com/egose/egose/commit/8a881038c9dcd734dd7283d60e0ff530fc26341f))

## [0.13.1](https://github.com/egose/egose/compare/v0.13.0...v0.13.1) (2023-04-23)

## [0.13.0](https://github.com/egose/egose/compare/v0.12.0...v0.13.0) (2023-04-22)


### ⚠ BREAKING CHANGES

* use PATCH methods for partial update endpoints
* rename baseUrl to basePath

### Features

* **acl:** add model option parentPath ([65010bf](https://github.com/egose/egose/commit/65010bf006a18654d1240f6c620394b939712abe))
* **acl:** log router endpoints ([2a0dbed](https://github.com/egose/egose/commit/2a0dbed5bf74a7ca478fb333a640d1dfcd2ad8b1))
* **acl:** send error status codes properly ([1f98afe](https://github.com/egose/egose/commit/1f98afefb5b36c6f41c6098a5dab9967800a6a99))
* **swagger:** add swagger package ([bfea7bc](https://github.com/egose/egose/commit/bfea7bcdf304338e6c042d4cd978b7fae0e0c0ab))
* use PATCH methods for partial update endpoints ([f28b0da](https://github.com/egose/egose/commit/f28b0dac6af7c9e9a5b7c4ed498a53728f997fb6))


### Refactors

* **acl:** organize options structure ([dfe61ce](https://github.com/egose/egose/commit/dfe61ceaaa492d18716968ef8167df8e39425dd0))
* organize options system ([27b9e4c](https://github.com/egose/egose/commit/27b9e4cc6dd70a6ef8e8d1383daaaf2e14f73535))
* rename baseUrl to basePath ([5b25304](https://github.com/egose/egose/commit/5b25304c428ff729513ce2b46e68dd8d3d53c4d1))

## [0.11.2](https://github.com/egose/egose/compare/v0.11.1...v0.11.2) (2023-04-17)

## [0.10.3](https://github.com/egose/egose/compare/v0.10.2...v0.10.3) (2023-02-25)

## [0.10.2](https://github.com/egose/egose/compare/v0.10.1...v0.10.2) (2023-02-25)

## [0.10.1](https://github.com/egose/egose/compare/v0.10.0...v0.10.1) (2023-02-25)

## [0.10.0](https://github.com/egose/egose/compare/v0.9.7...v0.10.0) (2023-02-25)

## [0.9.7](https://github.com/egose/egose/compare/v0.9.4...v0.9.7) (2023-02-24)


### Features

* add process query option ([9dcaed9](https://github.com/egose/egose/commit/9dcaed9e03d989d5fd67ac4178db1dd9270c0aa6))

## [0.9.4](https://github.com/egose/egose/compare/v0.9.3...v0.9.4) (2022-10-09)

## [0.9.3](https://github.com/egose/egose/compare/v0.9.2...v0.9.3) (2022-10-09)


### Features

* deploy mkdocs ([b55deb1](https://github.com/egose/egose/commit/b55deb12549fe06a97858a954b42373ba870ade8))

## [0.9.2](https://github.com/egose/egose/compare/d269a9913104a3464b6709a8ff678e8a292e0f63...v0.9.2) (2022-10-07)


### Features

* add acl package ([d269a99](https://github.com/egose/egose/commit/d269a9913104a3464b6709a8ff678e8a292e0f63))
* add deco package ([4551629](https://github.com/egose/egose/commit/45516290bda6d86113274e4bada762d8fb5c4539))
* add package publish workflow ([1384b90](https://github.com/egose/egose/commit/1384b9056ab41297e3d8b4f96d3dd07a21f7a006))

