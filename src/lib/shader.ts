// vim: tabstop=8 softtabstop=0 noexpandtab shiftwidth=8 nosmarttab
// Copyright 2025 Digital Signage Bunny Corp. Use of this source code is
// governed by an MIT-style license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

const shader = (strings: TemplateStringsArray, ...values: string[]) => {
        const shaderText = values.reduce((acc, v, idx) => acc + v + strings[idx + 1], strings[0]);
        return shaderText?.replace(/^\s+#/, '#');
};

export default shader;
