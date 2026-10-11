const { withAppBuildGradle } = require("@expo/config-plugins");
const generateCode = require("@expo/config-plugins/build/utils/generateCode");

const resolveAppGradleString = (options) => {
    const rnJetifierName = options?.android?.legacyJetifier
        ? "jetified-react-native"
        : "jetified-react-android";

    return `tasks.whenTaskAdded { tas ->
        if (tas.name.contains("merge") && tas.name.contains("NativeLibs")) {
            tasks.named(tas.name) {
                doFirst {
                    def matchingDirectory = it.externalLibNativeLibs
                        .getFiles()
                        .find { file -> file.toString().contains("${rnJetifierName}") }

                    if (matchingDirectory != null) {
                        java.nio.file.Files.walk(matchingDirectory.toPath()).withCloseable { paths ->
                            paths.forEach { file ->
                                if (file.toString().contains("libc++_shared.so")) {
                                    java.nio.file.Files.deleteIfExists(file)
                                }
                            }
                        }
                    } else {
                        println("VLC plugin: ${rnJetifierName} nicht gefunden; Native-Library-Bereinigung übersprungen.")
                    }
                }
            }
        }
    }`;
};

const withGradleTasks = (config, options) => {
    if(!options || !options.android){
        return config;
    }
    return withAppBuildGradle(config, (config) => {
        const newCode = generateCode.mergeContents({
            tag: "withVlcMediaPlayer",
            src: config.modResults.contents,
            newSrc: resolveAppGradleString(options),
            anchor: /autolinkLibrariesWithApp\(\)/i,
            offset: 2,
            comment: "//",
        });

        config.modResults.contents = newCode.contents;

        return config;
    });
};

module.exports = withGradleTasks;
